// App.tsx
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Boards from "./pages/Boards";
import Tasks from "./pages/Tasks";
import Users from "./pages/Users";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/boards" element={<Boards />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/users" element={<Users />} />
    </Routes>
  );
}

export default App;
