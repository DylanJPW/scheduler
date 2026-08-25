import type {
  Lesson,
  SolveResponse,
  Student,
  Teacher,
  TimeSlot,
} from "../../types";

export interface TimeTableProps {
  timeSlotList: TimeSlot[];
  lessonList: Lesson[];
  result?: SolveResponse | null;
  highlightedLessonIds?: number[];
}

export interface ScheduleViewProps {
  lessonList: Lesson[];
  timeSlotList: TimeSlot[];
  students: Student[];
  teachers: Teacher[];
}