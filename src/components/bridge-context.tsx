import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { neutralInput, type InputState, type ButtonName } from "../../packages/shared-protocol";
import { setButton } from "../../packages/controller-core";
import { applyProfile } from "../../packages/input-mapping";
import {
  ControllerTransport,
  initialStats,
  type ConnectionConfig,
  type ConnectionStats,
} from "../../packages/networking";
import {
  DEFAULT_PROFILES,
  loadProfiles,
  saveProfiles,
  type Profile,
} from "../../packages/profiles";
interface BridgeState {
  input: InputState;
  output: InputState;
  profiles: Profile[];
  profile: Profile;
  config: ConnectionConfig;
  stats: ConnectionStats;
  fullScreen: boolean;
  setFullScreen: (on: boolean) => void;
  updateInput: (patch: Partial<InputState>) => void;
  press: (name: ButtonName, down: boolean) => void;
  reset: () => void;
  setConfig: (patch: Partial<ConnectionConfig>) => void;
  connect: () => void;
  disconnect: () => void;
  selectProfile: (id: string) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  addProfile: (profile: Profile) => void;
  removeProfile: (id: string) => void;
  message: string;
  setMessage: (message: string) => void;
}
const BridgeContext = createContext<BridgeState | null>(null);
export function BridgeProvider({ children }: { children: ReactNode }) {
  const [input, setInput] = useState<InputState>(neutralInput);
  const inputRef = useRef(input);
  const [profiles, setProfiles] = useState<Profile[]>(DEFAULT_PROFILES);
  const [active, setActive] = useState("playstation");
  const [ready, setReady] = useState(false);
  const profile = profiles.find((p) => p.id === active) ?? DEFAULT_PROFILES[0] ?? profiles[0];
  const [config, setConfiguration] = useState<ConnectionConfig>({
    host: "",
    port: 8765,
    pin: "",
    secure: true,
    mode: "wifi",
  });
  const [stats, setStats] = useState<ConnectionStats>(initialStats);
  const [message, setMessage] = useState("");
  const [fullScreen, setFullScreen] = useState(false);
  const transport = useRef<ControllerTransport | null>(null);
  const deviceId = useRef("");
  useEffect(() => {
    setProfiles(loadProfiles(localStorage));
    setActive(localStorage.getItem("dsb-active-profile") ?? "playstation");
    deviceId.current = localStorage.getItem("dsb-device-id") ?? crypto.randomUUID();
    localStorage.setItem("dsb-device-id", deviceId.current);
    setReady(true);
    transport.current = new ControllerTransport(setStats);
    return () => transport.current?.disconnect();
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      saveProfiles(localStorage, profiles);
      localStorage.setItem("dsb-active-profile", active);
    } catch {
      setMessage("Your browser could not save this profile. Export it to keep a copy.");
    }
  }, [profiles, active, ready]);
  useEffect(() => {
    if (!profile) return;
    const timer = setInterval(
      () => transport.current?.send(applyProfile(inputRef.current, profile)),
      1000 / profile.frequency,
    );
    return () => clearInterval(timer);
  }, [profile]);
  const reset = () => {
    inputRef.current = neutralInput();
    setInput(inputRef.current);
    transport.current?.send(neutralInput());
  };
  useEffect(() => {
    const clear = () => {
      inputRef.current = neutralInput();
      setInput(inputRef.current);
      transport.current?.send(neutralInput());
    };
    const visibility = () => {
      if (document.hidden) clear();
    };
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (stats.status !== "connected") {
      inputRef.current = neutralInput();
      setInput(inputRef.current);
    }
  }, [stats.status]);
  useEffect(() => {
    const onChange = () => setFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  if (!profile) return null;
  const updateInput = (patch: Partial<InputState>) => {
    inputRef.current = { ...inputRef.current, ...patch };
    setInput(inputRef.current);
  };
  const press = (name: ButtonName, down: boolean) => {
    inputRef.current = setButton(inputRef.current, name, down);
    setInput(inputRef.current);
    if (down && profile.haptics && typeof navigator.vibrate === "function")
      navigator.vibrate(profile.vibration);
  };
  const value: BridgeState = {
    input,
    output: applyProfile(input, profile),
    profiles,
    profile,
    config,
    stats,
    fullScreen,
    setFullScreen,
    updateInput,
    press,
    reset,
    setConfig: (patch) => setConfiguration((old) => ({ ...old, ...patch })),
    connect: () => {
      setMessage("");
      try {
        if (location.protocol === "https:" && !config.secure)
          throw new Error(
            "This secure page requires WSS. For local WS, serve the web controller from the companion with a trusted certificate or a supported local browser origin.",
          );
        transport.current?.connect(config, deviceId.current);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Connection failed");
      }
    },
    disconnect: () => {
      transport.current?.disconnect();
      reset();
    },
    selectProfile: (id) => {
      reset();
      setActive(id);
    },
    updateProfile: (patch) => {
      reset();
      setProfiles((old) => old.map((p) => (p.id === profile.id ? { ...p, ...patch } : p)));
    },
    addProfile: (p) => {
      setProfiles((old) => [...old.filter((x) => x.id !== p.id), p]);
      setActive(p.id);
    },
    removeProfile: (id) => {
      if (profiles.length <= 1) return;
      setProfiles((old) => old.filter((p) => p.id !== id));
      if (active === id) setActive(profiles.find((p) => p.id !== id)?.id ?? "playstation");
    },
    message,
    setMessage,
  };
  return (
    <BridgeContext.Provider value={value}>
      <div className={fullScreen ? "fullscreen-controller" : ""}>{children}</div>
    </BridgeContext.Provider>
  );
}
export function useBridge() {
  const context = useContext(BridgeContext);
  if (!context) throw new Error("BridgeProvider is required");
  return context;
}
