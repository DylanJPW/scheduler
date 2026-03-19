import type { Student, Teacher } from "../../types";

export type EntityId = number | string;
export type WithId = { id: EntityId };

export type ColDef = {
  name: string;
  field: string;
};

export interface TimeSlotParams {
  dayStart: string;
  dayEnd: string;
  lengthOfLesson: number;
}

export interface SolverPayload extends TimeSlotParams {
  studentList: Student[];
  teacherList: Teacher[];
}
