import type { Student, Teacher } from "../../types";

export type EntityId = number | string;
export type WithId = { id: EntityId };

export const InputType = {
  text: "text",
  select: "select",
  multiSelect: "multiSelect",
  timeRange: "timeRange",
};

export type InputType = keyof typeof InputType;

export type KeyValue = {
  [key: string]: string;
};

export type ColDef = {
  name: string;
  field: string;
  type?: InputType;
  options?: KeyValue[];
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
