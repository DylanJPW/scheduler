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
};

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface Student {
  id: number | string;
  name: string;
  instrument: string;
  skillLevel: string;
}

export interface Teacher {
  id: number | string;
  name: string;
  instruments: Instrument[];
}

export type StudentInput = Omit<Student, "id">;
export type TeacherInput = Omit<Teacher, "id">;

export interface Lesson {
  id: number;
  instrument: Instrument;
  students: Student[];
  teacher: Teacher;
  timeSlot: TimeSlot;
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
