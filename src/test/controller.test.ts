import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { mapStick, mapTrigger, setButton, resetInput } from "../../packages/controller-core";
import {
  neutralInput,
  encodeInput,
  decodeInput,
  inputSchema,
} from "../../packages/shared-protocol";
import { defaultProfile, loadProfiles, saveProfiles, profileSchema } from "../../packages/profiles";
import { applyProfile } from "../../packages/input-mapping";
import {
  ControllerTransport,
  connectionURL,
  type ConnectionStats,
} from "../../packages/networking";
const config = {
  host: "192.168.1.10",
  port: 8765,
  pin: "123456",
  secure: false,
  mode: "wifi" as const,
};
class FakeSocket {
  readyState = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  messages: string[] = [];
  send(raw: string) {
    this.messages.push(raw);
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  reply(value: unknown) {
    this.onmessage?.({ data: JSON.stringify(value) });
  }
}
const socketAsWebSocket = (socket: FakeSocket) => socket as unknown as WebSocket;
describe("controller engine", () => {
  it("maps circular stick movement inside a unit circle", () => {
    const [x, y] = mapStick(1, 1, 0);
    expect(Math.hypot(x, y)).toBeCloseTo(1);
    expect(x).toBeCloseTo(Math.SQRT1_2);
  });
  it("applies configurable center dead zone", () => {
    expect(mapStick(0.05, 0.05, 0.12)).toEqual([0, 0]);
    expect(mapStick(1, 0, 0.12)).toEqual([1, 0]);
  });
  it("maps triggers from zero to 100 percent without exceeding the range", () => {
    expect(mapTrigger(-0.1)).toBe(0);
    expect(mapTrigger(0.5)).toBe(0.5);
    expect(mapTrigger(2)).toBe(1);
  });
  it("supports simultaneous press and release without losing other buttons", () => {
    let input = setButton(neutralInput(), "cross", true);
    input = setButton(input, "l1", true);
    input = setButton(input, "cross", false);
    expect(input.buttons).toEqual(["l1"]);
  });
  it("clears every control on reset", () => {
    expect(resetInput()).toEqual({
      left: [0, 0],
      right: [0, 0],
      l2: 0,
      r2: 0,
      buttons: [],
      dpad: [0, 0],
      touch: { active: false, x: 0, y: 0 },
    });
  });
  it("preserves dpad and remaps face buttons with inversion and stick swap", () => {
    const p = {
      ...defaultProfile(),
      swapSticks: true,
      invertY: true,
      mapping: { cross: "circle" as const },
    };
    const value = applyProfile(
      { ...neutralInput(), left: [0, 1], right: [1, 0], buttons: ["cross"], dpad: [-1, 1] },
      p,
    );
    expect(value.left[0]).toBe(1);
    expect(value.right[1]).toBe(-1);
    expect(value.buttons).toEqual(["circle"]);
    expect(value.dpad).toEqual([-1, 1]);
  });
});
describe("shared protocol", () => {
  const packet = {
    ...neutralInput(),
    type: "input" as const,
    version: 1 as const,
    deviceId: "test",
    sequence: 1,
    timestamp: 10,
  };
  it("round-trips the versioned JSON protocol", () =>
    expect(decodeInput(encodeInput(packet))).toEqual(packet));
  it("requires discrete D-pad states", () => {
    expect(inputSchema.safeParse({ ...packet, dpad: [-1, 1] }).success).toBe(true);
    expect(inputSchema.safeParse({ ...packet, dpad: [0.5, 0] }).success).toBe(false);
  });
  it("rejects malformed axes and unsupported versions", () => {
    expect(inputSchema.safeParse({ ...packet, left: [2, 0] }).success).toBe(false);
    expect(inputSchema.safeParse({ ...packet, version: 2 }).success).toBe(false);
  });
  it("rejects unknown buttons and invalid trigger pressure", () => {
    expect(inputSchema.safeParse({ ...packet, buttons: ["fake"] }).success).toBe(false);
    expect(inputSchema.safeParse({ ...packet, l2: 1.1 }).success).toBe(false);
  });
  it("uses the same WebSocket URL for Wi-Fi and USB tethering", () =>
    expect(connectionURL({ ...config, mode: "usb" })).toBe(connectionURL(config)));
  it("validates port range and six-digit pairing PIN", () => {
    expect(() => connectionURL({ ...config, port: 0 })).toThrow();
    expect(() => connectionURL({ ...config, pin: "123" })).toThrow();
  });
});
describe("profiles", () => {
  beforeEach(() => localStorage.clear());
  it("persists and reads back custom profiles", () => {
    const p = defaultProfile("custom", "My GTA setup", "custom");
    saveProfiles(localStorage, [p]);
    expect(loadProfiles(localStorage)).toEqual([p]);
  });
  it("rejects unsafe profile values and recovers corrupted storage", () => {
    expect(profileSchema.safeParse({ ...defaultProfile(), deadzone: 1 }).success).toBe(false);
    localStorage.setItem("dsb-profiles-v1", "bad-json");
    expect(loadProfiles(localStorage)[0]?.name).toBe("PlayStation");
  });
});
describe("paired WebSocket transport", () => {
  let sockets: FakeSocket[];
  let latest: ConnectionStats | undefined;
  let transport: ControllerTransport;
  beforeEach(() => {
    vi.useFakeTimers();
    sockets = [];
    transport = new ControllerTransport(
      (stats) => {
        latest = stats;
      },
      () => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socketAsWebSocket(socket);
      },
    );
  });
  afterEach(() => {
    transport.disconnect();
    vi.useRealTimers();
  });
  const first = () => {
    const socket = sockets[0];
    if (!socket) throw new Error("Expected a socket");
    return socket;
  };
  it("does not send gamepad inputs before PIN acceptance", () => {
    transport.connect(config, "test");
    first().open();
    transport.send({ ...neutralInput(), buttons: ["cross"] });
    expect(first().messages.map((raw) => JSON.parse(raw).type)).toEqual(["pair"]);
    first().reply({ type: "paired", version: 1, pcName: "PC", virtualGamepad: true });
    transport.send({ ...neutralInput(), buttons: ["cross"] });
    expect(JSON.parse(first().messages.at(-1) ?? "{}").buttons).toEqual(["cross"]);
  });
  it("rejects failed pairing without retrying or accepting input", () => {
    transport.connect(config, "test");
    first().open();
    first().reply({ type: "error", message: "Invalid PIN" });
    expect(latest?.status).toBe("error");
    vi.advanceTimersByTime(10000);
    expect(sockets).toHaveLength(1);
  });
  it("resets the native input before a clean disconnect", () => {
    transport.connect(config, "test");
    first().open();
    first().reply({ type: "paired", version: 1, pcName: "PC", virtualGamepad: true });
    transport.send({ ...neutralInput(), buttons: ["cross"] });
    transport.disconnect();
    const inputs = first()
      .messages.map((raw) => JSON.parse(raw))
      .filter((value) => value.type === "input");
    expect(inputs.at(-1)?.buttons).toEqual([]);
    expect(inputs.at(-1)?.left).toEqual([0, 0]);
    expect(latest?.virtualGamepad).toBe(false);
  });
  it("reconnects after an unexpected connection close", () => {
    transport.connect(config, "test");
    first().open();
    first().close();
    vi.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(2);
    expect(latest?.reconnects).toBe(1);
  });
  it("times out a companion that stops answering heartbeats", () => {
    transport.connect(config, "test");
    first().open();
    first().reply({ type: "paired", version: 1, pcName: "PC", virtualGamepad: true });
    vi.advanceTimersByTime(7000);
    expect(first().readyState).toBe(3);
    expect(latest?.virtualGamepad).toBe(false);
  });
  it("sends only changes while allowing independent heartbeat", () => {
    transport.connect(config, "test");
    first().open();
    first().reply({ type: "paired", version: 1, pcName: "PC", virtualGamepad: false });
    transport.send(neutralInput());
    transport.send(neutralInput());
    expect(latest?.sent).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(JSON.parse(first().messages.at(-1) ?? "{}").type).toBe("ping");
  });
});
