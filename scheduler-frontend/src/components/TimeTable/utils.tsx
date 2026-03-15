import type { Instrument } from "./types";

export function getInstrumentTheme(instrument: Instrument) {
  switch (instrument) {
    case "BANJO":
      return "amber";
    case "FIDDLE":
      return "blue";
    case "FLUTE":
      return "fuchsia";
    case "GUITAR":
      return "emerald";
    case "WHISTLE":
      return "red";
    default:
      return "slate";
  }
}
