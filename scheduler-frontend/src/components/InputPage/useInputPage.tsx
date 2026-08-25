import { useState } from "react";
import axios from "axios";
import type { Lesson, SolveResponse, Student, Teacher, TimeSlot } from "../../types";
import type { SolverPayload, TimeSlotParams } from "./types";
import {
  DEFAULT_DAY_END,
  DEFAULT_DAY_START,
  DEFAULT_LESSON_LENGTH,
} from "../../constants";

import mockStudents from "../../mockData/students.json";
import mockTeachers from "../../mockData/teachers.json";
import mockTimeSlots from "../../mockData/timeslots.json";

const requestURL = "api/timeTable";

const defaultTimeSlotParams: TimeSlotParams = {
  dayStart: DEFAULT_DAY_START,
  dayEnd: DEFAULT_DAY_END,
  lengthOfLesson: DEFAULT_LESSON_LENGTH,
};

function describeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { message?: string } | undefined;
    if (body?.message) return body.message;
    if (!error.response) {
      return "Could not reach the server. Is the backend running on port 8080?";
    }
    return `${error.response.status}: ${error.message}`;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function useInputPage() {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [teachers, setTeachers] = useState<Teacher[]>(
    mockTeachers as Teacher[],
  );
  const [timeSlotList, setTimeSlotList] = useState<TimeSlot[]>(mockTimeSlots);
  const [lessonList, setLessonList] = useState<Lesson[]>([] as Lesson[]);

  const [timeSlotParams, setTimeSlotParams] = useState<TimeSlotParams>(
    defaultTimeSlotParams,
  );

  const [isSolving, setIsSolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SolveResponse | null>(null);

  const solveTimeTable = async () => {
    setIsSolving(true);
    setError(null);
    try {
      const payload: SolverPayload = {
        studentList: students,
        teacherList: teachers,
        ...timeSlotParams,
      };
      const { data } = await axios.post<SolveResponse>(
        `${requestURL}/solve`,
        payload,
      );
      setResult(data);
      setLessonList(data.lessonList);
      setTimeSlotList(data.timeSlotList);
    } catch (e) {
      setError(describeError(e));
      setResult(null);
    } finally {
      setIsSolving(false);
    }
  };

  return {
    students,
    setStudents,
    teachers,
    setTeachers,
    timeSlotParams,
    setTimeSlotParams,
    solveTimeTable,
    timeSlotList,
    setTimeSlotList,
    lessonList,
    setLessonList,
    isSolving,
    error,
    result,
  };
}