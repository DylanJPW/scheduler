import { Instrument, SkillLevel, type Student, type TimeSlot } from "../types";
import { isBlankRow, type Grid } from "./grid";

export type StudentField =
  | "name"
  | "instrument"
  | "skillLevel"
  | "familyId"
  | "dateOfBirth"
  | "preferredStart"
  | "preferredEnd"
  | "preferredRange";

export interface ColumnMatch {
  index: number;
  header: string;
  field: StudentField | null;
}

export interface RowNote {
  line: number;
  who: string;
  message: string;
}

export interface StudentImport {
  headerLine: number | null;
  columns: ColumnMatch[];
  students: Student[];
  notes: RowNote[];
  skipped: RowNote[];
  rowsRead: number;
  fatal?: string;
}

const HEADER_SYNONYMS: [StudentField, string[]][] = [
  ["name", ["name", "studentname", "student", "fullname", "pupil", "child"]],
  ["instrument", ["instrument", "instruments"]],
  ["skillLevel", ["skilllevel", "level", "ability", "standard", "grade"]],
  ["familyId", ["family", "familyid", "familyname", "household", "siblinggroup", "siblings"]],
  ["dateOfBirth", ["dateofbirth", "dob", "birthday", "birthdate", "born", "dateofbirthdmy"]],
  ["preferredStart", ["preferredstart", "preferredtimefrom", "preferredfrom", "earliest", "starttime", "start", "from"]],
  ["preferredEnd", ["preferredend", "preferredtimeto", "preferredto", "latest", "endtime", "end", "to"]],
  ["preferredRange", ["preferredtime", "preferredtimerange", "preferredtimes", "preference", "timepreference"]],
];

const MAX_HEADER_SEARCH_ROWS = 10;
const OLDEST_PLAUSIBLE_YEARS = 100;

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function matchHeader(header: string): StudentField | null {
  const folded = fold(header);
  if (folded === "") return null;
  for (const [field, synonyms] of HEADER_SYNONYMS) {
    if (synonyms.includes(folded)) return field;
  }
  return null;
}

function findHeaderRow(grid: Grid): number {
  let best = -1;
  let bestScore = 0;

  const limit = Math.min(grid.length, MAX_HEADER_SEARCH_ROWS);
  for (let i = 0; i < limit; i++) {
    const matches = grid[i].map(matchHeader);
    if (!matches.includes("name")) continue;
    const score = matches.filter((field) => field !== null).length;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

function lookupOption(dictionary: Record<string, string>, value: string): string | null {
  const folded = fold(value);
  if (folded === "") return null;
  for (const [key, label] of Object.entries(dictionary)) {
    if (fold(label) === folded || fold(key) === folded) return key;
  }
  return null;
}

function optionNames(dictionary: Record<string, string>): string {
  return Object.values(dictionary).join(", ");
}

interface Parsed<T> {
  value?: T;
  error?: string;
}

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

function parseDate(raw: string, today: Date): Parsed<string> {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  const dmy = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})$/.exec(raw);

  let year: number;
  let month: number;
  let day: number;

  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (dmy) {
    day = Number(dmy[1]);
    month = Number(dmy[2]);
    year = Number(dmy[3]);
    if (dmy[3].length === 2) {
      year += 2000;
      if (year > today.getFullYear()) year -= 100;
    }
  } else {
    return { error: `date of birth "${raw}" is not a date I can read — use 03/09/2015 or 2015-09-03` };
  }

  if (month > 12 && day <= 12) {
    return { error: `date of birth "${raw}" looks like month/day order — please write it as day/month` };
  }

  const asDate = new Date(Date.UTC(year, month - 1, day));
  const isReal =
    asDate.getUTCFullYear() === year &&
    asDate.getUTCMonth() === month - 1 &&
    asDate.getUTCDate() === day;
  if (!isReal) return { error: `date of birth "${raw}" is not a real date` };

  if (asDate.getTime() > today.getTime()) {
    return { error: `date of birth "${raw}" is in the future` };
  }
  if (today.getFullYear() - year > OLDEST_PLAUSIBLE_YEARS) {
    return { error: `date of birth "${raw}" is more than ${OLDEST_PLAUSIBLE_YEARS} years ago` };
  }

  return { value: `${year}-${twoDigits(month)}-${twoDigits(day)}` };
}

function parseTime(raw: string): Parsed<string> {
  const match = /^(\d{1,2})\s*[:.]\s*(\d{2})\s*(am|pm)?$|^(\d{1,2})\s*(am|pm)$/i.exec(raw);
  if (!match) {
    return { error: `time "${raw}" is not a time I can read — use 18:30 or 6:30pm` };
  }

  let hour = Number(match[1] ?? match[4]);
  const minute = Number(match[2] ?? 0);
  const meridiem = (match[3] ?? match[5] ?? "").toLowerCase();

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  if (hour > 23 || minute > 59) return { error: `time "${raw}" is not a real time` };
  return { value: `${twoDigits(hour)}:${twoDigits(minute)}` };
}

function splitRange(raw: string): string[] {
  return raw
    .split(/\s*(?:-|–|—|\bto\b|\buntil\b)\s*/i)
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

function splitInstruments(raw: string): string[] {
  return raw
    .split(/\s*(?:[,;/&+]|\band\b)\s*/i)
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

interface RowReader {
  get: (field: StudentField) => string;
  has: (field: StudentField) => boolean;
}

function rowReader(cells: string[], columns: ColumnMatch[]): RowReader {
  const byField = new Map<StudentField, number>();
  for (const column of columns) {
    if (column.field && !byField.has(column.field)) byField.set(column.field, column.index);
  }
  return {
    get: (field) => {
      const index = byField.get(field);
      return index === undefined ? "" : (cells[index] ?? "");
    },
    has: (field) => byField.has(field),
  };
}

export interface MapOptions {
  today?: Date;
  makeId?: () => string;
}

export function mapStudents(grid: Grid, options: MapOptions = {}): StudentImport {
  const today = options.today ?? new Date();
  const makeId = options.makeId ?? (() => crypto.randomUUID());

  const empty: StudentImport = {
    headerLine: null,
    columns: [],
    students: [],
    notes: [],
    skipped: [],
    rowsRead: 0,
  };

  if (grid.every(isBlankRow)) {
    return { ...empty, fatal: "There is nothing to import yet — paste your columns above." };
  }

  const headerIndex = findHeaderRow(grid);
  if (headerIndex === -1) {
    return {
      ...empty,
      fatal:
        "I could not find a header row. The first row should name the columns — " +
        "Name, Instrument, Skill Level, Family, Date of Birth, Preferred Start, Preferred End. " +
        "Make sure you copied the heading row too.",
    };
  }

  const columns: ColumnMatch[] = grid[headerIndex].map((header, index) => ({
    index,
    header,
    field: matchHeader(header),
  }));

  const students: Student[] = [];
  const notes: RowNote[] = [];
  const skipped: RowNote[] = [];

  const familySpellings = new Map<string, string>();
  let rowsRead = 0;

  for (let i = headerIndex + 1; i < grid.length; i++) {
    const cells = grid[i];
    if (isBlankRow(cells)) continue;

    const line = i + 1;
    rowsRead++;

    const row = rowReader(cells, columns);
    const name = row.get("name");

    if (name === "") {
      skipped.push({
        line,
        who: cells.find((cell) => cell !== "") ?? "",
        message: "no name in this row, so it was skipped",
      });
      continue;
    }

    const note = (message: string) => notes.push({ line, who: name, message });

    let instrument = "";
    const instrumentRaw = row.get("instrument");
    if (instrumentRaw !== "") {
      const parts = splitInstruments(instrumentRaw);
      const keys = parts.map((part) => ({ part, key: lookupOption(Instrument, part) }));
      const known = keys.filter((entry) => entry.key !== null);
      const unknown = keys.filter((entry) => entry.key === null);

      if (known.length > 0) instrument = known[0].key as string;

      if (unknown.length > 0) {
        note(
          `instrument "${unknown.map((entry) => entry.part).join('", "')}" is not one I know — ` +
            `expected one of: ${optionNames(Instrument)}`,
        );
      }
      if (known.length > 1) {
        note(
          `lists ${known.length} instruments — used ${Instrument[known[0].key as keyof typeof Instrument]}. ` +
            "A student can only hold one instrument here; add a second row for the other.",
        );
      }
    }

    let skillLevel = "";
    const skillRaw = row.get("skillLevel");
    if (skillRaw !== "") {
      const key = lookupOption(SkillLevel, skillRaw);
      if (key) skillLevel = key;
      else note(`skill level "${skillRaw}" is not one I know — expected one of: ${optionNames(SkillLevel)}`);
    }

    let familyId: string | undefined;
    const familyRaw = row.get("familyId").replace(/\s+/g, " ");
    if (familyRaw !== "") {
      const key = familyRaw.toLowerCase();
      const existing = familySpellings.get(key);
      if (existing) {
        familyId = existing;
      } else {
        familySpellings.set(key, familyRaw);
        familyId = familyRaw;
      }
    }

    let dateOfBirth = "";
    const dobRaw = row.get("dateOfBirth");
    if (dobRaw !== "") {
      const parsed = parseDate(dobRaw, today);
      if (parsed.value) dateOfBirth = parsed.value;
      else if (parsed.error) note(parsed.error);
    }

    let preferredTimeRange: TimeSlot | undefined;
    let startRaw = row.get("preferredStart");
    let endRaw = row.get("preferredEnd");

    const rangeRaw = row.get("preferredRange");
    if (rangeRaw !== "" && startRaw === "" && endRaw === "") {
      const parts = splitRange(rangeRaw);
      if (parts.length === 2) {
        startRaw = parts[0];
        endRaw = parts[1];
      } else {
        note(`preferred time "${rangeRaw}" needs a start and an end, like 18:30-19:30`);
      }
    }

    if (startRaw !== "" || endRaw !== "") {
      const start = startRaw === "" ? undefined : parseTime(startRaw);
      const end = endRaw === "" ? undefined : parseTime(endRaw);
      if (start?.error) note(start.error);
      if (end?.error) note(end.error);

      if (start?.value && end?.value) {
        if (start.value >= end.value) {
          note(`preferred time ends at or before it starts (${start.value}–${end.value}), so it was left blank`);
        } else {
          preferredTimeRange = { startTime: start.value, endTime: end.value };
        }
      } else if (!start?.error && !end?.error) {
        note("preferred time has only one end of the range, so it was left blank");
      }
    }

    const student: Student = {
      id: makeId(),
      name,
      instrument,
      skillLevel,
      dateOfBirth,
    };
    if (familyId) student.familyId = familyId;
    if (preferredTimeRange) student.preferredTimeRange = preferredTimeRange;

    students.push(student);
  }

  return {
    headerLine: headerIndex + 1,
    columns,
    students,
    notes,
    skipped,
    rowsRead,
  };
}

export function describeDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(match[3])} ${months[Number(match[2]) - 1]} ${match[1]}`;
}

export function countRowsWithNotes(notes: RowNote[]): number {
  return new Set(notes.map((note) => note.line)).size;
}
