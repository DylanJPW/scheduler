import type {
  Lesson,
  Room,
  SolveResponse,
  Student,
  Teacher,
  TimeSlot,
} from "../../types";

export interface TimeTableProps {
  timeSlotList: TimeSlot[];
  roomList: Room[];
  lessonList: Lesson[];
  result?: SolveResponse | null;
  highlightedLessonIds?: number[];
}

export interface ScheduleViewProps {
  lessonList: Lesson[];
  timeSlotList: TimeSlot[];
  roomList: Room[];
  students: Student[];
  teachers: Teacher[];
}