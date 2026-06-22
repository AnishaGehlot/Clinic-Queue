import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

export default function PatientScreen() {
  const [queue, setQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [avgTime, setAvgTime] = useState(10 * 60 * 1000);

  useEffect(() => {
    const doctorsRef = ref(db, "doctors");
    onValue(doctorsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.values(data) : [];
      setDoctors(list);
      if (list.length > 0) setSelectedDoctor(list[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedDoctor) { setQueue([]); return; }

    const queueRef = ref(db, "queues/" + selectedDoctor);
    const unsub = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      const list = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];
      list.sort((a, b) => {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        return a.time - b.time;
      });
      setQueue(list);
    });
    return () => unsub();
  }, [selectedDoctor]);

  useEffect(() => {
    if (!selectedDoctor) return;
    const completedRef = ref(db, "completedVisits/" + selectedDoctor);
    onValue(completedRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      const visits = Object.values(data);
      const last5 = visits.slice(-5);
      const total = last5.reduce((sum, v) => sum + v.waitDuration, 0);
      setAvgTime(total / last5.length);
    });
  }, [selectedDoctor]);

  const formatMinutes = (ms) => {
    const totalMinutes = Math.round(ms / 60000);
    if (totalMinutes < 1) return "< 1 min";
    if (totalMinutes < 60) return totalMinutes + " min";
    const hours = Math.floor(totalMinutes / 60);
    const rem = totalMinutes % 60;
    if (rem === 0) return hours + " hr";
    return hours + " hr " + rem + " min";
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Live Queue</h1>
      <p style={styles.subheading}>Real-time patient queue status</p>

      {doctors.length > 0 && (
        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          style={styles.select}
        >
          {doctors.map((doc) => (
            <option key={doc} value={doc}>{doc}</option>
          ))}
        </select>
      )}

      {selectedDoctor && (
        <div style={styles.doctorLabel}>
          Showing queue for <strong>{selectedDoctor}</strong>
        </div>
      )}

      <div style={styles.queueHeader}>
        <span style={styles.queueTitle}>Waiting</span>
        <span style={styles.queueCount}>{queue.length}</span>
      </div>

      {queue.length === 0 ? (
        <p style={styles.emptyState}>No patients waiting right now.</p>
      ) : (
        queue.map((patient, index) => (
          <div
            key={patient.id}
            style={{
              ...styles.card,
              borderLeft: patient.urgent ? "4px solid #ef4444" : "4px solid #2563eb"
            }}
          >
            <div>
              <div style={styles.cardName}>
                {index + 1}. {patient.name}
                {patient.urgent && <span style={styles.urgentBadge}>URGENT</span>}
              </div>
              <div style={styles.cardStatus}>
                Token: <strong>{patient.token}</strong> &nbsp;·&nbsp; ETA: {formatMinutes(index * avgTime)}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container: { padding: "24px 20px" },
  heading: { fontSize: "24px", fontWeight: "700", color: "#0f172a" },
  subheading: { fontSize: "14px", color: "#64748b", marginTop: "4px", marginBottom: "20px" },
  select: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    marginBottom: "10px"
  },
  doctorLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "16px"
  },
  queueHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px"
  },
  queueTitle: { fontSize: "16px", fontWeight: "700", color: "#0f172a" },
  queueCount: {
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    fontWeight: "700",
    fontSize: "13px",
    padding: "4px 10px",
    borderRadius: "12px"
  },
  emptyState: { color: "#94a3b8", fontSize: "14px", textAlign: "center", marginTop: "30px" },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "14px 16px",
    marginBottom: "10px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
  },
  cardName: { fontSize: "15px", fontWeight: "600", color: "#0f172a" },
  cardStatus: { fontSize: "13px", color: "#94a3b8", marginTop: "4px" },
  urgentBadge: {
    backgroundColor: "#fef2f2",
    color: "#ef4444",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "10px",
    marginLeft: "8px"
  }
};