import { THEMES } from "./types";

export function getTheme(value: string) {
  switch (value) {
    case "BANJO":
      return THEMES.amber;
    case "FIDDLE":
      return THEMES.blue;
    case "Teachers":
    case "FLUTE":
      return THEMES.emerald;
    case "GUITAR":
      return THEMES.fuchsia;
    case "WHISTLE":
      return THEMES.red;
    case "Students":
    default:
      return THEMES.slate;
  }
}
