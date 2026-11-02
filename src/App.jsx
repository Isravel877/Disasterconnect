
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import HelperDashboard from "./Pages/HelperDashboard";
import Navbar from "./Components/Navbar";
import MyRequests from "./Pages/MyRequests";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import RequesterDashboard from "./Pages/RequesterDashboard";
import CreateHelpRequest from "./Pages/CreateHelpRequest";
import MyAssignments from "./Pages/MyAssignments";
import AdminDashboard from "./Pages/AdminDashboard";
import HelpRequests from "./Pages/HelperDashboard";
import ManageDisasters from "./Pages/ManageDisasters";
import ManageUsers from "./Pages/ManageUsers";
import ManageResources from "./Pages/ManageResources";
import ManageAssignments from "./Pages/ManageAssingment";
import ManageReports from "./Pages/ManageReports";
import  Register from "./Pages/Register";
import Footer from "./Components/Footer"
import "./App.css";



function getDashboardPath(role) {
  const routes = {
    ADMIN: "/admin-dashboard",
    HELPER: "/helper/dashboard",
    REQUESTER: "/requester/dashboard",
  };

  return routes[role] || "/login";
}

function RequireRole({ allowedRoles, children }) {
  const token = localStorage.getItem("token");

  const role = (localStorage.getItem("role") || "")
    .replace(/^ROLE_/i, "")
    .toUpperCase();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return (
      <Navigate
        to={getDashboardPath(role)}
        replace
      />
    );
  }

  return children;
}


function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* General pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
         <Route path="/createAcount" element={<Register/>}/>
       

        <Route
          path="/admin-dashboard"
          element={
            <RequireRole allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/admin/requests"
          element={
            <RequireRole allowedRoles={["ADMIN"]}>
              <HelpRequests />
            </RequireRole>
          }
        />

        <Route
          path="/admin/disasters"
          element={
            <RequireRole allowedRoles={["ADMIN"]}>
              <ManageDisasters />
            </RequireRole>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RequireRole allowedRoles={["ADMIN"]}>
              <ManageUsers />
            </RequireRole>
          }
        />

        <Route
          path="/admin/resources"
          element={
            <RequireRole allowedRoles={["ADMIN"]}>
              <ManageResources />
            </RequireRole>
          }
        />

        <Route
          path="/admin/assignments"
          element={
            <RequireRole allowedRoles={["ADMIN"]}>
              <ManageAssignments />
            </RequireRole>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <RequireRole allowedRoles={["ADMIN"]}>
              <ManageReports />
            </RequireRole>
          }
        />

        {/* Helper pages */}
        <Route
          path="/helper/dashboard"
          element={
            <RequireRole allowedRoles={["HELPER"]}>
              <HelperDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/helper/assignments"
          element={
            <RequireRole allowedRoles={["HELPER"]}>
              <MyAssignments />
            </RequireRole>
          }
        />

        {/* Requester pages */}
        <Route
          path="/requester/dashboard"
          element={
            <RequireRole allowedRoles={["REQUESTER"]}>
              <RequesterDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/requester/create-request"
          element={
            <RequireRole allowedRoles={["REQUESTER"]}>
              <CreateHelpRequest />
            </RequireRole>
          }
        />

        <Route
          path="/requester/requests"
          element={
            <RequireRole allowedRoles={["REQUESTER"]}>
              <MyRequests />
            </RequireRole>
          }
        />

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

        
      </Routes>

      <Footer/>
    </BrowserRouter>
  );
}

export default App;
