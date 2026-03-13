import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Router } from "./Router";
import "./App.css";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Router />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
