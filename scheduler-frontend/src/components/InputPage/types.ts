import type { EntityId, Room, Student, Teacher } from "../../types";

export type { EntityId } from "../../types";
export type WithId = { id: EntityId };

export type InputType =
  | "text"
  | "date"
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
  roomList: Room[];
}

export type ListKey = "students" | "teachers" | "rooms";

export interface Highlight {
  list: ListKey;
  entityIds: EntityId[];
  note: string;
  nonce: number;
}