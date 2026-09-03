import { Instrument, SkillLevel } from "../types";

export const TEMPLATE_HEADERS = [
  "Name",
  "Instrument",
  "Skill Level",
  "Family",
  "Date of Birth",
  "Preferred Start",
  "Preferred End",
] as const;

const EXAMPLE_ROWS = [
  ["Aoife Ní Bhriain", "Fiddle", "Beginner", "Ní Bhriain", "03/09/2015", "18:30", "19:30"],
  ["Cillian Ní Bhriain", "Whistle", "Beginner", "Ní Bhriain", "11/02/2013", "", ""],
  ["Seán Ó Ceallaigh", "Banjo", "Intermediate", "", "24/06/2011", "", ""],
];

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function templateCsv(): string {
  return toCsv([TEMPLATE_HEADERS, ...EXAMPLE_ROWS]);
}

export const INSTRUMENT_NAMES = Object.values(Instrument);
export const SKILL_LEVEL_NAMES = Object.values(SkillLevel);

export function downloadText(filename: string, text: string, mimeType: string): void {
  const blob = new Blob(["\uFEFF", text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
