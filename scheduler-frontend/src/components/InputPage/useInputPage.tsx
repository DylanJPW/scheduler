import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import type { SolveResponse, Student, Teacher, TimeSlot } from "../../types";
import type { SolverPayload, TimeSlotParams } from "./types";
import {
  ASSUMED_MAX_CLASS_SIZE,
  DEFAULT_DAY_END,
  DEFAULT_DAY_START,
  DEFAULT_LESSON_LENGTH,
} from "../../constants";
import { buildTimeSlots } from "../../evening";
import { clearInput, loadInput, saveInput } from "../../storage";
import { validateInput } from "../../validation";

import sampleStudents from "../../mockData/students.json";
import sampleTeachers from "../../mockData/teachers.json";

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
  const restored = useMemo(() => loadInput(), []);

  const [students, setStudents] = useState<Student[]>(
    restored?.students ?? (sampleStudents as Student[]),
  );
  const [teachers, setTeachers] = useState<Teacher[]>(
    restored?.teachers ?? (sampleTeachers as Teacher[]),
  );
  const [timeSlotParams, setTimeSlotParams] = useState<TimeSlotParams>(
    restored?.timeSlotParams ?? defaultTimeSlotParams,
  );
  const [restoredFromSave] = useState(restored !== null);

  const [isSolving, setIsSolving] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SolveResponse | null>(null);

  const initial = useRef({ students, teachers, timeSlotParams });
  useEffect(() => {
    const untouched =
      students === initial.current.students &&
      teachers === initial.current.teachers &&
      timeSlotParams === initial.current.timeSlotParams;
    if (untouched) return;
    saveInput({ students, teachers, timeSlotParams });
  }, [students, teachers, timeSlotParams]);

  const solveStartedAt = useRef(0);
  useEffect(() => {
    if (!isSolving) return;
    solveStartedAt.current = Date.now();
    setElapsedMs(0);
    const timer = window.setInterval(
      () => setElapsedMs(Date.now() - solveStartedAt.current),
      200,
    );
    return () => window.clearInterval(timer);
  }, [isSolving]);

  const maxClassSize = result?.maxStudentsPerClass ?? ASSUMED_MAX_CLASS_SIZE;

  const problems = useMemo(
    () => validateInput({ students, teachers, timeSlotParams, maxClassSize }),
    [students, teachers, timeSlotParams, maxClassSize],
  );

  const lessonList = result?.lessonList ?? [];

  const previewSlots = useMemo(
    () => buildTimeSlots(timeSlotParams),
    [timeSlotParams],
  );
  const timeSlotList: TimeSlot[] = result?.timeSlotList ?? previewSlots;

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
    } catch (e) {
      setError(describeError(e));
      setResult(null);
    } finally {
      setIsSolving(false);
    }
  };

  const resetToSample = () => {
    clearInput();
    setStudents(sampleStudents as Student[]);
    setTeachers(sampleTeachers as Teacher[]);
    setTimeSlotParams(defaultTimeSlotParams);
    setResult(null);
    setError(null);
  };

  return {
    students,
    setStudents,
    teachers,
    setTeachers,
    timeSlotParams,
    setTimeSlotParams,
    solveTimeTable,
    resetToSample,
    restoredFromSave,
    timeSlotList,
    lessonList,
    isSolving,
    elapsedMs,
    error,
    result,
    problems,
  };
}