export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface Student {
  name: string;
  instrument: string;
  skillLevel: string;
}

export interface Teacher {
  name: string;
  instruments: Instrument[];
}

export interface Lesson {
  id: number;
  instrument: Instrument;
  students: Student[];
  teacher: Teacher;
  timeSlot: TimeSlot;
}

export type Instrument = "BANJO" | "FIDDLE" | "FLUTE" | "GUITAR" | "WHISTLE";
