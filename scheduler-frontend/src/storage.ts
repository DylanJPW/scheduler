import type { Room, Student, Teacher } from "./types";
import type { TimeSlotParams } from "./components/InputPage/types";

const STORAGE_KEY = "scheduler.input.v1";

export interface StoredInput {
  students: Student[];
  teachers: Teacher[];
  rooms: Room[];
  timeSlotParams: TimeSlotParams;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStoredInput(raw: string): StoredInput | null {
  const parsed: unknown = JSON.parse(raw);
  if (!isObject(parsed)) return null;

  const { students, teachers, rooms, timeSlotParams } = parsed;
  if (!Array.isArray(students) || !Array.isArray(teachers)) return null;
  if (!isObject(timeSlotParams)) return null;

  const { dayStart, dayEnd, lengthOfLesson } = timeSlotParams;
  if (typeof dayStart !== "string" || typeof dayEnd !== "string") return null;
  if (typeof lengthOfLesson !== "number") return null;

  return {
    students: students as Student[],
    teachers: teachers as Teacher[],
    rooms: rooms as Room[],
    timeSlotParams: { dayStart, dayEnd, lengthOfLesson },
  };
}

export function loadInput(): StoredInput | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseStoredInput(raw);
  } catch {
    return null;
  }
}

export function saveInput(input: StoredInput): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  } catch {
    // Quota exceeded or storage disabled
  }
}

export function clearInput(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Quota exceeded or storage disabled
  }
}