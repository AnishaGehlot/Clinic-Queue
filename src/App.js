import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import ReceptionistScreen from "./components/ReceptionistScreen";
import PatientScreen from "./components/PatientScreen";
import StatusScreen from "./components/StatusScreen";
import AnalyticsScreen from "./components/AnalyticsScreen";
import "./App.css";

function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="app">
      <div className="tab-bar">
        <Link
          to="/receptionist"
          className={location.pathname === "/receptionist" ? "tab active" : "tab"}
        >
          🏥 Reception
        </Link>
        <Link
          to="/patient"
          className={location.pathname === "/patient" || location.pathname === "/" ? "tab active" : "tab"}
        >
          🪑 Queue
        </Link>
        <Link
          to="/status"
          className={location.pathname === "/status" ? "tab active" : "tab"}
        >
          🔍 Status
        </Link>
        <Link
          to="/analytics"
          className={location.pathname === "/analytics" ? "tab active" : "tab"}
        >
          📊 Stats
        </Link>
      </div>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<PatientScreen />} />
          <Route path="/patient" element={<PatientScreen />} />
          <Route path="/receptionist" element={<ReceptionistScreen />} />
          <Route path="/status" element={<StatusScreen />} />
          <Route path="/analytics" element={<AnalyticsScreen />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}