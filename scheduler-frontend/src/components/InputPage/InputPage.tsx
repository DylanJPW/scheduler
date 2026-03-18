import { InputAccordion } from "./InputAccordion";
import type { Student, Teacher } from "../../types";
import mockStudents from "../../mockData/students.json";
import mockTeachers from "../../mockData/teachers.json";

export const InputPage = () => {
  const studentColDefs = [
    {
      name: "Name",
      field: "name",
    },
    {
      name: "Instrument",
      field: "instrument",
    },
    {
      name: "Skill Level",
      field: "skillLevel",
    },
  ];

  const teacherColDefs = [
    {
      name: "Name",
      field: "name",
    },
    {
      name: "Instruments",
      field: "instruments",
    },
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      <InputAccordion<Student>
        label="Students"
        initialItems={mockStudents}
        colDefs={studentColDefs}
      />
      <InputAccordion<Teacher>
        label="Teachers"
        initialItems={mockTeachers as Teacher[]}
        colDefs={teacherColDefs}
      />
    </div>
  );
};
