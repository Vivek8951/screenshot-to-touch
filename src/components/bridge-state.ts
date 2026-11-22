import { createContext, useContext } from "react";
import type { InputState, ButtonName } from "../../packages/shared-protocol";
import type { ConnectionConfig, ConnectionStats } from "../../packages/networking";
import type { Profile } from "../../packages/profiles";

export interface BridgeState {
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
export const BridgeContext = createContext<BridgeState | null>(null);
export function useBridge() {
  const context = useContext(BridgeContext);
  if (!context) throw new Error("BridgeProvider is required");
  return context;
}
