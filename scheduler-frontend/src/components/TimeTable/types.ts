import type { TimeSlot, Lesson, SolveResponse } from "../../types";

export interface TimeTableProps {
  timeSlotList: TimeSlot[];
  lessonList: Lesson[];
  result?: SolveResponse | null;
}