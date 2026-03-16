import { Route, Routes } from "react-router-dom";
import { TimeTable } from "./components/TimeTable/TimeTable";
import { InputPage } from "./components/InputPage/InputPage";

export const Router = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<InputPage />} />
        <Route path="/result" element={<TimeTable />} />
      </Routes>
    </>
  );
};
