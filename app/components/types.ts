export const SignalType = {
  FM: "FM",
  AM: "AM",
} as const;

export type SignalType = (typeof SignalType)[keyof typeof SignalType];
