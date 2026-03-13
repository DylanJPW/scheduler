import { Route, Routes } from "react-router-dom";
import { TimeTable } from "./components/TimeTable/TimeTable";

export const Router = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<TimeTable />} />
      </Routes>
    </>
  );
};
