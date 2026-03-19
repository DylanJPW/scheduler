import { useState } from "react";
import axios from "axios";
import type { Lesson, Student, Teacher, TimeSlot } from "../../types";
import type { SolverPayload, TimeSlotParams } from "./types";
import {
  DEFAULT_DAY_END,
  DEFAULT_DAY_START,
  DEFAULT_LESSON_LENGTH,
} from "../../constants";

import mockStudents from "../../mockData/students.json";
import mockTeachers from "../../mockData/teachers.json";
import mockTimeSlots from "../../mockData/timeslots.json";
import mockLessons from "../../mockData/lessons.json";

const requestURL = "api/timeTable";

const defaultTimeSlotParams: TimeSlotParams = {
  dayStart: DEFAULT_DAY_START,
  dayEnd: DEFAULT_DAY_END,
  lengthOfLesson: DEFAULT_LESSON_LENGTH,
};

export function useInputPage() {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [teachers, setTeachers] = useState<Teacher[]>(
    mockTeachers as Teacher[],
  );
  const [timeSlotList, setTimeSlotList] = useState<TimeSlot[]>(mockTimeSlots);
  const [lessonList, setLessonList] = useState<Lesson[]>(
    mockLessons as Lesson[],
  );

  const [timeSlotParams, setTimeSlotParams] = useState<TimeSlotParams>(
    defaultTimeSlotParams,
  );

  const solveTimeTable = async () => {
    const payload: SolverPayload = {
      studentList: students,
      teacherList: teachers,
      ...timeSlotParams,
    };
    await axios.post(requestURL + "/solve", payload).then((res) => {
      const { lessonList: l, timeSlotList: t } = res.data;
      setLessonList(l);
      setTimeSlotList(t);
    });
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
  };
}
