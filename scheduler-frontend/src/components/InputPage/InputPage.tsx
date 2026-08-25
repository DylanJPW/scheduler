import { InputAccordion } from "./InputAccordion";
import {
  Instrument,
  SkillLevel,
  type Student,
  type Teacher,
} from "../../types";
import { TimeSlotInput } from "./TimeSlotInput";
import { useInputPage } from "./useInputPage";
import { TimeTable } from "../TimeTable/TimeTable";
import { type ColDef } from "./types";
import { mapDictToKeyValue } from "../shared/utils";

const studentColDefs: ColDef[] = [
  { name: "Name", field: "name" },
  {
    name: "Instrument",
    field: "instrument",
    type: "select",
    options: mapDictToKeyValue(Instrument),
  },
  {
    name: "Skill Level",
    field: "skillLevel",
    type: "select",
    options: mapDictToKeyValue(SkillLevel),
  },
  { name: "Preferred Time", field: "preferredTimeRange", type: "timeRange" },
];

const teacherColDefs: ColDef[] = [
  { name: "Name", field: "name" },
  {
    name: "Instruments",
    field: "instruments",
    type: "multiSelect",
    options: mapDictToKeyValue(Instrument),
  },
  { name: "Preferred Time", field: "preferredTimeRange", type: "timeRange" },
];

export const InputPage = () => {
  const {
    students,
    setStudents,
    teachers,
    setTeachers,
    timeSlotParams,
    setTimeSlotParams,
    solveTimeTable,
    timeSlotList,
    lessonList,
    isSolving,
    error,
    result,
  } = useInputPage();

  return (
    <div className="flex flex-col gap-4 w-full">
      <TimeSlotInput
        timeSlotParams={timeSlotParams}
        setTimeSlotParams={setTimeSlotParams}
      />
      <InputAccordion<Student>
        label="Students"
        initialItems={students}
        colDefs={studentColDefs}
        setPayloadItems={setStudents}
      />
      <InputAccordion<Teacher>
        label="Teachers"
        initialItems={teachers}
        colDefs={teacherColDefs}
        setPayloadItems={setTeachers}
      />

      <div className="flex flex-row items-center justify-end gap-4">
        {error && (
          <p className="text-red-300 text-sm text-right" role="alert">
            {error}
          </p>
        )}
        <button
          className="bg-blue-800 rounded-lg p-2 min-w-24 hover:cursor-pointer hover:bg-blue-700 transition-[background-color] duration-250 disabled:bg-slate-600 disabled:cursor-not-allowed"
          onClick={() => void solveTimeTable()}
          disabled={isSolving}
        >
          {isSolving ? "Solving…" : "Solve"}
        </button>
      </div>

      <TimeTable
        timeSlotList={timeSlotList}
        lessonList={lessonList}
        result={result}
      />
    </div>
  );
};