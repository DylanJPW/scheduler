export const COL_NAMES = {
  name: "Name",
  instrument: "Instrument",
  instruments: "Instruments",
  skillLevel: "Skill Level",
} as const;

export type COL_NAMES = (typeof COL_NAMES)[keyof typeof COL_NAMES];
