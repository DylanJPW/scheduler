import { Route, Routes } from "react-router-dom";
import { InputPage } from "./components/InputPage/InputPage";

export const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<InputPage />} />
    </Routes>
  );
};