import { z } from "zod";
import { BUTTONS } from "../shared-protocol";
export const profileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(40),
  layout: z.enum(["playstation", "xbox", "generic", "custom"]),
  deadzone: z.number().min(0).max(0.5),
  sensitivity: z.number().min(0.2).max(2),
  curve: z.number().min(0.5).max(3),
  triggerSensitivity: z.number().min(0.2).max(2),
  invertX: z.boolean(),
  invertY: z.boolean(),
  swapSticks: z.boolean(),
  buttonScale: z.number().min(0.75).max(1.25),
  opacity: z.number().min(0.4).max(1),
  haptics: z.boolean(),
  vibration: z.number().min(10).max(100),
  frequency: z.number().int().min(20).max(120),
  mapping: z.record(z.enum(BUTTONS)),
  positions: z
    .record(z.object({ x: z.number().min(-30).max(30), y: z.number().min(-30).max(30) }))
    .default({}),
});
export type Profile = z.infer<typeof profileSchema>;
export function defaultProfile(
  id = "playstation",
  name = "PlayStation",
  layout: Profile["layout"] = "playstation",
): Profile {
  return {
    id,
    name,
    layout,
    deadzone: 0.12,
    sensitivity: 1,
    curve: 1,
    triggerSensitivity: 1,
    invertX: false,
    invertY: false,
    swapSticks: false,
    buttonScale: 1,
    opacity: 1,
    haptics: true,
    vibration: 20,
    frequency: 60,
    mapping: Object.fromEntries(BUTTONS.map((b) => [b, b])),
    positions: {},
  };
}
export const DEFAULT_PROFILES = [
  defaultProfile(),
  defaultProfile("xbox", "Xbox Compatible", "xbox"),
  defaultProfile("generic", "Generic Gamepad", "generic"),
];
export function loadProfiles(storage: Pick<Storage, "getItem">): Profile[] {
  try {
    const raw = storage.getItem("dsb-profiles-v1");
    return raw ? z.array(profileSchema).min(1).parse(JSON.parse(raw)) : DEFAULT_PROFILES;
  } catch {
    return DEFAULT_PROFILES;
  }
}
export function saveProfiles(storage: Pick<Storage, "setItem">, profiles: Profile[]) {
  storage.setItem("dsb-profiles-v1", JSON.stringify(z.array(profileSchema).min(1).parse(profiles)));
}
