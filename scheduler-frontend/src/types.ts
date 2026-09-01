export type ThemeScale = {
  darker: string;
  dark: string;
  base: string;
  light: string;
  lighter: string;
};

export const THEMES: Record<string, ThemeScale> = {
  amber: {
    darker: "bg-amber-900",
    dark: "bg-amber-800",
    base: "bg-amber-700",
    light: "bg-amber-600",
    lighter: "bg-amber-500",
  },
  blue: {
    darker: "bg-blue-900",
    dark: "bg-blue-800",
    base: "bg-blue-700",
    light: "bg-blue-600",
    lighter: "bg-blue-500",
  },
  emerald: {
    darker: "bg-emerald-900",
    dark: "bg-emerald-800",
    base: "bg-emerald-700",
    light: "bg-emerald-600",
    lighter: "bg-emerald-500",
  },
  fuchsia: {
    darker: "bg-fuchsia-900",
    dark: "bg-fuchsia-800",
    base: "bg-fuchsia-700",
    light: "bg-fuchsia-600",
    lighter: "bg-fuchsia-500",
  },
  red: {
    darker: "bg-red-900",
    dark: "bg-red-800",
    base: "bg-red-700",
    light: "bg-red-600",
    lighter: "bg-red-500",
  },
  slate: {
    darker: "bg-slate-900",
    dark: "bg-slate-800",
    base: "bg-slate-700",
    light: "bg-slate-600",
    lighter: "bg-slate-500",
  },
  teal: {
    darker: "bg-teal-900",
    dark: "bg-teal-800",
    base: "bg-teal-700",
    light: "bg-teal-600",
    lighter: "bg-teal-500",
  },
  violet: {
    darker: "bg-violet-900",
    dark: "bg-violet-800",
    base: "bg-violet-700",
    light: "bg-violet-600",
    lighter: "bg-violet-500",
  },
  orange: {
    darker: "bg-orange-900",
    dark: "bg-orange-800",
    base: "bg-orange-700",
    light: "bg-orange-600",
    lighter: "bg-orange-500",
  },
};

export type EntityId = number | string;

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface Room {
  id: EntityId;
  name: string;
}

export interface Person {
  id: EntityId;
  name: string;
  preferredTimeRange?: TimeSlot;
  key?: string;
}

export interface Student extends Person {
  instrument: string;
  skillLevel: string;
  familyId?: string;
  dateOfBirth?: string;
  ageInYears?: number;
}

export interface Teacher extends Person {
  instruments: string[];
  preferredRoomId?: string;
}

export type RoomInput = Omit<Room, "id">;
export type StudentInput = Omit<Student, "id">;
export type TeacherInput = Omit<Teacher, "id">;

export interface Lesson {
  id: number;
  instrument: string;
  students: Student[];
  teacher: Teacher;
  timeSlot: TimeSlot;
  room: Room;
}

export const Instrument = {
  BANJO: "Banjo",
  FIDDLE: "Fiddle",
  FLUTE: "Flute",
  GUITAR: "Guitar",
  WHISTLE: "Whistle",
  BODHRAN: "Bodhrán",
  MANDOLIN: "Mandolin",
  ACCORDION: "Accordion",
};

export type Instrument = keyof typeof Instrument;

export const SkillLevel = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export type SkillLevel = keyof typeof SkillLevel;

export function instrumentLabel(key: string): string {
  return Instrument[key as Instrument] ?? key;
}

export function skillLevelLabel(key: string): string {
  return SkillLevel[key as SkillLevel] ?? key;
}

export interface BrokenRule {
  constraintName: string;
  description: string;
  scoreImpact: string;
  lessonIds: number[];
  studentKeys: string[];
  teacherKeys: string[];
}

export interface SolveResponse {
  lessonList: Lesson[];
  timeSlotList: TimeSlot[];
  roomList: Room[];
  score: string;
  feasible: boolean;
  hardScore: number;
  softScore: number;
  unusedMinutes: number;
  emptyClassCount: number;
  minStudentsPerClass: number;
  maxStudentsPerClass: number;
  brokenRules?: BrokenRule[];
}