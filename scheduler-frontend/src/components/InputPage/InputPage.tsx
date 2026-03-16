import { InputAccordion } from "./InputAccordion";
import mockStudents from "../../mockData/students.json";
import mockTeachers from "../../mockData/teachers.json";

export const InputPage = () => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <InputAccordion label="Students" data={mockStudents} />
      <InputAccordion label="Teachers" data={mockTeachers} />
    </div>
  );
};
