import { THEMES, type ThemeScale } from "./types";

const THEME_BY_KEY: Record<string, ThemeScale> = {
  BANJO: THEMES.amber,
  FIDDLE: THEMES.blue,
  FLUTE: THEMES.emerald,
  GUITAR: THEMES.fuchsia,
  WHISTLE: THEMES.red,
  BODHRAN: THEMES.teal,
  MANDOLIN: THEMES.violet,
  ACCORDION: THEMES.orange,
  Teachers: THEMES.emerald,
  Students: THEMES.slate,
  Rooms: THEMES.violet,
};

export function getTheme(value: string): ThemeScale {
  return THEME_BY_KEY[value] ?? THEMES.slate;
}
