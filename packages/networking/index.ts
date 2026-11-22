import {
  VERSION,
  replySchema,
  encodeInput,
  neutralInput,
  type InputState,
} from "../shared-protocol";
export type ConnectionMode = "wifi" | "usb";
export type ConnectionStatus = "disconnected" | "connecting" | "pairing" | "connected" | "error";
export interface ConnectionConfig {
  host: string;
  port: number;
  pin: string;
  secure: boolean;
  mode: ConnectionMode;
}
export interface ConnectionStats {
  status: ConnectionStatus;
  latency: number | null;
  sent: number;
  received: number;
  reconnects: number;
  pcName: string;
  virtualGamepad: boolean;
  error: string;
  lastReceived: number | null;
  logs: string[];
}
export const initialStats = (): ConnectionStats => ({
  status: "disconnected",
  latency: null,
  sent: 0,
  received: 0,
  reconnects: 0,
  pcName: "No PC connected",
  virtualGamepad: false,
  error: "",
  lastReceived: null,
  logs: [],
});
export function connectionURL(config: ConnectionConfig) {
  if (
    !/^[a-zA-Z0-9.:[\]-]+$/.test(config.host) ||
    !config.host ||
    !Number.isInteger(config.port) ||
    config.port < 1 ||
    config.port > 65535
  )
    throw new Error("Enter a valid PC address and port (1–65535).");
  if (!/^\d{6}$/.test(config.pin)) throw new Error("Enter the six-digit PIN shown on your PC.");
  const host =
    config.host.includes(":") && !config.host.startsWith("[") ? `[${config.host}]` : config.host;
  return `${config.secure ? "wss" : "ws"}://${host}:${config.port}`;
}
export class ControllerTransport {
  private socket: WebSocket | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private state = initialStats();
  private seq = 0;
  private id = "";
  private lastPong = 0;
  private lastInput = "";
  private input: InputState = neutralInput();
  private config: ConnectionConfig | null = null;
  private stopped = true;
  private retries = 0;
  private openedAt = 0;
  constructor(
    private notify: (state: ConnectionStats) => void,
    private socketFactory: (url: string) => WebSocket = (url) => new WebSocket(url),
  ) {}
  private update(patch: Partial<ConnectionStats>) {
    this.state = { ...this.state, ...patch };
    this.notify({ ...this.state });
  }
  private log(message: string) {
    this.update({
      logs: [...this.state.logs, `${new Date().toLocaleTimeString()} · ${message}`].slice(-50),
    });
  }
  connect(config: ConnectionConfig, deviceId: string) {
    const url = connectionURL(config);
    this.disconnect();
    this.config = config;
    this.id = deviceId;
    this.stopped = false;
    this.retries = 0;
    this.open(url);
  }
  private open(url: string) {
    this.update({ status: "connecting", error: "", virtualGamepad: false });
    this.log("Opening local connection");
    try {
      const socket = this.socketFactory(url);
      this.socket = socket;
      socket.onopen = () => {
        if (this.socket !== socket) return;
        this.openedAt = Date.now();
        this.lastPong = Date.now();
        this.update({ status: "pairing" });
        socket.send(
          JSON.stringify({
            type: "pair",
            version: VERSION,
            deviceId: this.id,
            pin: this.config?.pin,
          }),
        );
        this.timer = setInterval(() => {
          if (
            Date.now() - this.lastPong > 6000 ||
            (this.state.status === "pairing" && Date.now() - this.openedAt > 6000)
          ) {
            this.log("Heartbeat or pairing timed out");
            socket.close();
            return;
          }
          if (socket.readyState === 1)
            socket.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
        }, 1000);
      };
      socket.onmessage = (event) => {
        try {
          const reply = replySchema.parse(JSON.parse(String(event.data)));
          this.lastPong = Date.now();
          this.update({ received: this.state.received + 1, lastReceived: Date.now() });
          if (reply.type === "paired") {
            this.retries = 0;
            this.update({
              status: "connected",
              pcName: reply.pcName,
              virtualGamepad: reply.virtualGamepad,
            });
            this.log("PIN accepted · connection paired");
          } else if (reply.type === "pong")
            this.update({ latency: Math.max(0, Date.now() - reply.timestamp) });
          else {
            this.stopped = true;
            this.update({ status: "error", error: reply.message });
            socket.close();
          }
        } catch {
          this.log("Rejected malformed companion message");
        }
      };
      socket.onerror = () =>
        this.update({
          error:
            "Could not reach the companion. Check the address, firewall and WebSocket security.",
        });
      socket.onclose = () => {
        if (this.socket !== socket) return;
        this.clearTimer();
        this.socket = null;
        this.input = neutralInput();
        this.lastInput = "";
        this.update({
          status: this.stopped ? (this.state.error ? "error" : "disconnected") : "connecting",
          virtualGamepad: false,
          latency: null,
        });
        if (!this.stopped && this.retries < 3) {
          this.retries++;
          this.update({ reconnects: this.state.reconnects + 1 });
          this.log("Connection lost · retrying");
          this.retry = setTimeout(() => {
            if (!this.stopped) this.open(url);
          }, 1000 * this.retries);
        } else if (!this.stopped) {
          this.stopped = true;
          this.update({
            status: "error",
            error: "Connection lost. Reconnect when the companion is available.",
          });
        }
      };
    } catch (error) {
      this.stopped = true;
      this.update({
        status: "error",
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  }
  send(input: InputState) {
    this.input = input;
    const serialized = JSON.stringify(input);
    if (
      this.state.status !== "connected" ||
      this.socket?.readyState !== 1 ||
      serialized === this.lastInput
    )
      return;
    this.lastInput = serialized;
    this.socket.send(
      encodeInput({
        ...input,
        type: "input",
        version: VERSION,
        deviceId: this.id,
        sequence: ++this.seq,
        timestamp: Date.now(),
      }),
    );
    this.update({ sent: this.state.sent + 1 });
  }
  disconnect() {
    this.stopped = true;
    this.clearTimer();
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    if (this.socket?.readyState === 1) {
      this.send(neutralInput());
      this.socket.send(JSON.stringify({ type: "disconnect" }));
    }
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
    }
    this.socket = null;
    this.input = neutralInput();
    this.lastInput = "";
    this.update({ status: "disconnected", virtualGamepad: false, latency: null, error: "" });
  }
  private clearTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
