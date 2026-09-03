import { useMemo, useState } from "react";
import { InputAccordion } from "./InputAccordion";
import {
  Instrument,
  SkillLevel,
  type Room,
  type Student,
  type Teacher,
} from "../../types";
import { TimeSlotInput } from "./TimeSlotInput";
import { useInputPage } from "./useInputPage";
import { SolvePanel } from "./SolvePanel";
import { ImportStudentsDialog, type ImportMode } from "./ImportStudentsDialog";
import { ScheduleViews } from "../TimeTable/ScheduleViews";
import type { ColDef, Highlight } from "./types";
import { mapDictToKeyValue } from "../shared/utils";
import type { Problem } from "../../validation";

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
  { name: "Family", field: "familyId", type: "family" },
  { name: "Date of Birth", field: "dateOfBirth", type: "date" },
  {
    name: "Preferred Time",
    field: "preferredTimeRange",
    type: "timeRange",
    sortable: false,
  },
];

const roomColDefs: ColDef[] = [{ name: "Room", field: "name" }];

const buildTeacherColDefs = (rooms: Room[]): ColDef[] => [
  { name: "Name", field: "name" },
  {
    name: "Instruments",
    field: "instruments",
    type: "multiSelect",
    options: mapDictToKeyValue(Instrument),
  },
  {
    name: "Preferred Room",
    field: "preferredRoomId",
    type: "select",
    options: rooms.map((room) => ({
      key: String(room.id),
      value: room.name || "(unnamed room)",
    })),
  },
  {
    name: "Preferred Time",
    field: "preferredTimeRange",
    type: "timeRange",
    sortable: false,
  },
];

const newRoom = (): Room => ({
  id: crypto.randomUUID(),
  name: "",
});

const newStudent = (): Student => ({
  id: crypto.randomUUID(),
  name: "",
  instrument: "",
  skillLevel: "",
  dateOfBirth: "",
});

const newTeacher = (): Teacher => ({
  id: crypto.randomUUID(),
  name: "",
  instruments: [],
});

export const InputPage = () => {
  const {
    students,
    setStudents,
    teachers,
    setTeachers,
    rooms,
    setRooms,
    timeSlotParams,
    setTimeSlotParams,
    solveTimeTable,
    resetToSample,
    restoredFromSave,
    timeSlotList,
    roomList,
    lessonList,
    isSolving,
    elapsedMs,
    error,
    result,
    problems,
  } = useInputPage();

  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const importStudents = (imported: Student[], mode: ImportMode) => {
    setStudents(mode === "replace" ? imported : [...students, ...imported]);
    setImportOpen(false);
  };

  const teacherColDefs = useMemo(() => buildTeacherColDefs(rooms), [rooms]);

  const familyIds = useMemo(() => {
    const ids = new Set<string>();
    for (const student of students) {
      const familyId = student.familyId?.trim().toLowerCase();
      if (familyId) ids.add(familyId);
    }
    return [...ids].sort();
  }, [students]);

  const showMe = (problem: Problem) => {
    if (!problem.list || !problem.entityIds) return;
    setHighlight({
      list: problem.list,
      entityIds: problem.entityIds,
      note: problem.message,
      nonce: Date.now(),
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="text-left print:hidden">
        <h1 className="text-3xl font-semibold">Class scheduler</h1>
        <p className="opacity-80 pt-1">
          Set the evening, list the students and teachers, then solve. Your work
          is saved in this browser as you type.
          {restoredFromSave && " Picked up where you left off."}{" "}
          <button
            type="button"
            className="underline cursor-pointer"
            onClick={() => {
              if (
                window.confirm(
                  "Replace everything with the sample data? Your current lists will be lost.",
                )
              ) {
                resetToSample();
              }
            }}
          >
            Start again from the sample data
          </button>
        </p>
      </header>

      <div className="print:hidden flex flex-col gap-4">
        <TimeSlotInput
          timeSlotParams={timeSlotParams}
          setTimeSlotParams={setTimeSlotParams}
        />

        <InputAccordion<Room>
          label="Rooms"
          step="2."
          listKey="rooms"
          items={rooms}
          colDefs={roomColDefs}
          onChange={setRooms}
          makeBlank={newRoom}
          highlight={highlight}
        />

        <InputAccordion<Student>
          label="Students"
          step="3."
          listKey="students"
          items={students}
          colDefs={studentColDefs}
          onChange={setStudents}
          makeBlank={newStudent}
          familyIds={familyIds}
          highlight={highlight}
          toolbarActions={
            <button
              type="button"
              className="rounded-lg px-3 py-1 bg-blue-800 hover:bg-blue-700 cursor-pointer"
              onClick={() => setImportOpen(true)}
            >
              Import from a spreadsheet
            </button>
          }
        />

        <InputAccordion<Teacher>
          label="Teachers"
          step="4."
          listKey="teachers"
          items={teachers}
          colDefs={teacherColDefs}
          onChange={setTeachers}
          makeBlank={newTeacher}
          highlight={highlight}
        />

        <SolvePanel
          problems={problems}
          onShowMe={showMe}
          onSolve={() => void solveTimeTable()}
          isSolving={isSolving}
          elapsedMs={elapsedMs}
          error={error}
        />
      </div>

      {importOpen && (
        <ImportStudentsDialog
          existingCount={students.length}
          onClose={() => setImportOpen(false)}
          onImport={importStudents}
        />
      )}

      <ScheduleViews
        timeSlotList={timeSlotList}
        roomList={roomList}
        lessonList={lessonList}
        students={students}
        teachers={teachers}
        result={result}
      />

    </div>
  );
};