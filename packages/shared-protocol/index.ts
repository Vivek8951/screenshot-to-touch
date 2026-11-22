import { z } from "zod";
export const VERSION = 1 as const;
export const BUTTONS = [
  "cross",
  "circle",
  "square",
  "triangle",
  "l1",
  "r1",
  "l3",
  "r3",
  "create",
  "options",
  "system",
  "touchpad",
] as const;
export type ButtonName = (typeof BUTTONS)[number];
const axis = z.number().finite().min(-1).max(1);
const pressure = z.number().finite().min(0).max(1);
export const inputSchema = z.object({
  type: z.literal("input"),
  version: z.literal(VERSION),
  deviceId: z.string().min(1).max(64),
  sequence: z.number().int().nonnegative(),
  timestamp: z.number().finite().nonnegative(),
  left: z.tuple([axis, axis]),
  right: z.tuple([axis, axis]),
  l2: pressure,
  r2: pressure,
  buttons: z.array(z.enum(BUTTONS)).max(BUTTONS.length),
  dpad: z.tuple([
    z.union([z.literal(-1), z.literal(0), z.literal(1)]),
    z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  ]),
  touch: z.object({ active: z.boolean(), x: pressure, y: pressure }),
  gyro: z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]).optional(),
  acceleration: z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]).optional(),
  battery: pressure.optional(),
  extensions: z.record(z.unknown()).optional(),
});
export type InputPacket = z.infer<typeof inputSchema>;
export type InputState = Pick<
  InputPacket,
  "left" | "right" | "l2" | "r2" | "buttons" | "dpad" | "touch"
>;
export const neutralInput = (): InputState => ({
  left: [0, 0],
  right: [0, 0],
  l2: 0,
  r2: 0,
  buttons: [],
  dpad: [0, 0],
  touch: { active: false, x: 0, y: 0 },
});
export const replySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("paired"),
    version: z.literal(1),
    pcName: z.string(),
    virtualGamepad: z.boolean(),
  }),
  z.object({
    type: z.literal("pong"),
    timestamp: z.number().finite(),
    sequence: z.number().int().optional(),
  }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);
export function encodeInput(input: InputPacket) {
  return JSON.stringify(inputSchema.parse(input));
}
export function decodeInput(raw: string) {
  return inputSchema.parse(JSON.parse(raw));
}
