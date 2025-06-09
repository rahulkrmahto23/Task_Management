import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import "./App.css";
import Header from "./components/Header";
import Login from "./pages/Login";
import AdminPage from "./pages/AdminPage";
import EmployPage from "./pages/EmployPage";
import Signup from "./pages/Signup";
import ProjectPage from "./pages/ProjectPage";
import TeamPage from "./pages/TeamPage";
import TaskPage from "./pages/TaskPage";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/employee" element={<EmployPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/project" element={<ProjectPage />} />
        <Route path="/task" element={<TaskPage />} />
      </Routes>
    </Router>
  );
}

export default App;
