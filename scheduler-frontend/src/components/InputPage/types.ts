import type { EntityId, Student, Teacher } from "../../types";

export type { EntityId } from "../../types";
export type WithId = { id: EntityId };

export type InputType =
  | "text"
  | "family"
  | "select"
  | "multiSelect"
  | "timeRange";

export type KeyValue = {
  key: string;
  value: string;
};

export type ColDef = {
  name: string;
  field: string;
  type?: InputType;
  options?: KeyValue[];
  sortable?: boolean;
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

export interface Highlight {
  list: "students" | "teachers";
  entityIds: EntityId[];
  note: string;
  nonce: number;
}