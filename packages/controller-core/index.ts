import { neutralInput, type ButtonName, type InputState } from "../shared-protocol";
export function mapStick(
  x: number,
  y: number,
  deadzone = 0.12,
  sensitivity = 1,
  curve = 1,
): [number, number] {
  const length = Math.hypot(x, y);
  if (length <= deadzone || length === 0) return [0, 0];
  const value = Math.min(
    1,
    Math.pow((Math.min(1, length) - deadzone) / (1 - deadzone), curve) * sensitivity,
  );
  return [(x / length) * value, (y / length) * value];
}
export function mapTrigger(value: number, sensitivity = 1) {
  return Math.max(0, Math.min(1, value * sensitivity));
}
export function setButton(input: InputState, name: ButtonName, pressed: boolean): InputState {
  return {
    ...input,
    buttons: pressed
      ? [...new Set([...input.buttons, name])]
      : input.buttons.filter((b) => b !== name),
  };
}
export function resetInput(): InputState {
  return neutralInput();
}
