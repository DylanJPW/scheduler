import type { Student, Teacher } from "../../types";

export type EntityId = number | string;
export type WithId = { id: EntityId };

export const InputSelectType = {
  select: "select",
  multiSelect: "multiSelect",
};
export type InputType = "text" | keyof typeof InputSelectType;

export type ColDef = {
  name: string;
  field: string;
  type?: InputType;
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
