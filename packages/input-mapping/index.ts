import { mapStick, mapTrigger } from "../controller-core";
import { type InputState, type ButtonName } from "../shared-protocol";
import { type Profile } from "../profiles";
export function applyProfile(input: InputState, profile: Profile): InputState {
  const stick = (v: [number, number]): [number, number] => {
    const [x, y] = mapStick(v[0], v[1], profile.deadzone, profile.sensitivity, profile.curve);
    return [x * (profile.invertX ? -1 : 1), y * (profile.invertY ? -1 : 1)];
  };
  return {
    ...input,
    left: stick(profile.swapSticks ? input.right : input.left),
    right: stick(profile.swapSticks ? input.left : input.right),
    l2: mapTrigger(input.l2, profile.triggerSensitivity),
    r2: mapTrigger(input.r2, profile.triggerSensitivity),
    buttons: [...new Set(input.buttons.map((b) => profile.mapping[b] ?? b))] as ButtonName[],
  };
}
