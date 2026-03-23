import { InputAccordion } from "./InputAccordion";
import type { Student, Teacher } from "../../types";
import { TimeSlotInput } from "./TimeSlotInput";
import { useInputPage } from "./useInputPage";
import { TimeTable } from "../TimeTable/TimeTable";
import { type ColDef } from "./types";

const studentColDefs: ColDef[] = [
  {
    name: "Name",
    field: "name",
  },
  {
    name: "Instrument",
    field: "instrument",
    type: "select",
  },
  {
    name: "Skill Level",
    field: "skillLevel",
  },
];

const teacherColDefs: ColDef[] = [
  {
    name: "Name",
    field: "name",
  },
  {
    name: "Instruments",
    field: "instruments",
    type: "multiSelect",
  },
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
      <button
        className="bg-blue-800 rounded-lg p-2 w-16 self-end hover:cursor-pointer hover:bg-blue-700 transition[background-color] duration-250"
        onClick={() => solveTimeTable()}
      >
        Solve
      </button>

      <TimeTable timeSlotList={timeSlotList} lessonList={lessonList} />
    </div>
  );
};
