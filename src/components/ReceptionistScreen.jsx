import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, push, onValue, remove, set } from "firebase/database";

function generateToken() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const number = Math.floor(Math.random() * 90) + 10;
  return letter + number;
}

export default function ReceptionistScreen() {
  const [name, setName] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [queue, setQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [newDoctorName, setNewDoctorName] = useState("");
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [nowServing, setNowServing] = useState(null);

  useEffect(() => {
    const doctorsRef = ref(db, "doctors");
    onValue(doctorsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.values(data) : [];
      setDoctors(list);
      if (list.length > 0 && !selectedDoctor) setSelectedDoctor(list[0]);
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

    const nowServingRef = ref(db, "nowServing/" + selectedDoctor);
    onValue(nowServingRef, (snapshot) => {
      setNowServing(snapshot.val());
    });

    return () => unsub();
  }, [selectedDoctor]);

  const addDoctor = () => {
    const trimmed = newDoctorName.trim();
    if (trimmed === "") return;
    const doctorKey = trimmed.replace(/[.#$/\[\]]/g, "");
    set(ref(db, "doctors/" + doctorKey), trimmed);
    setSelectedDoctor(trimmed);
    setNewDoctorName("");
    setShowAddDoctor(false);
  };

  const callNext = () => {
    if (queue.length === 0) return;
    const next = queue[0];
    set(ref(db, "nowServing/" + selectedDoctor), {
      name: next.name,
      token: next.token,
      calledAt: Date.now()
    });
  };

  const addPatient = () => {
    if (name.trim() === "" || !selectedDoctor) return;
    const queueRef = ref(db, "queues/" + selectedDoctor);
    push(queueRef, {
      name: name,
      status: "waiting",
      urgent: isUrgent,
      time: Date.now(),
      token: generateToken()
    });
    setName("");
    setIsUrgent(false);
  };

  const removePatient = (id, addedTime) => {
    const waitDuration = Date.now() - addedTime;
    const completedRef = ref(db, "completedVisits/" + selectedDoctor);
    push(completedRef, {
      waitDuration: waitDuration,
      completedAt: Date.now()
    });
    remove(ref(db, "queues/" + selectedDoctor + "/" + id));

    // Auto call next
    const remaining = queue.filter(q => q.id !== id);
    if (remaining.length > 0) {
      const next = remaining[0];
      set(ref(db, "nowServing/" + selectedDoctor), {
        name: next.name,
        token: next.token,
        calledAt: Date.now()
      });
    } else {
      set(ref(db, "nowServing/" + selectedDoctor), null);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Receptionist</h1>
      <p style={styles.subheading}>Add patients to the live queue</p>

      <div style={styles.doctorSelectRow}>
        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          style={styles.select}
        >
          {doctors.length === 0 && <option value="">No doctors yet</option>}
          {doctors.map((doc) => (
            <option key={doc} value={doc}>{doc}</option>
          ))}
        </select>
        <button onClick={() => setShowAddDoctor(!showAddDoctor)} style={styles.addDoctorBtn}>
          + Doctor
        </button>
      </div>

      {showAddDoctor && (
        <div style={styles.addDoctorBox}>
          <input
            type="text"
            placeholder="e.g. Dr. Sharma"
            value={newDoctorName}
            onChange={(e) => setNewDoctorName(e.target.value)}
            style={styles.input}
            onKeyDown={(e) => e.key === "Enter" && addDoctor()}
          />
          <button onClick={addDoctor} style={styles.button}>
            Add Doctor
          </button>
        </div>
      )}

      {/* Now Serving Banner */}
      {nowServing && (
        <div style={styles.nowServingBanner}>
          <div style={styles.nowServingLabel}>🟢 Now Serving</div>
          <div style={styles.nowServingToken}>{nowServing.token}</div>
          <div style={styles.nowServingName}>{nowServing.name}</div>
        </div>
      )}

      {selectedDoctor && (
        <>
          <div style={styles.form}>
            <input
              type="text"
              placeholder="Patient name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              onKeyDown={(e) => e.key === "Enter" && addPatient()}
            />
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                style={styles.checkbox}
              />
              Mark as urgent
            </label>
            <button onClick={addPatient} style={styles.button}>
              Add to Queue
            </button>
          </div>

          <div style={styles.queueHeader}>
            <span style={styles.queueTitle}>{selectedDoctor}'s Queue</span>
            <span style={styles.queueCount}>{queue.length}</span>
          </div>

          {/* Call Next Button */}
          {queue.length > 0 && (
            <button onClick={callNext} style={styles.callNextBtn}>
              📢 Call Next Patient
            </button>
          )}

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
                    Token: <strong>{patient.token}</strong>
                  </div>
                </div>
                <button onClick={() => removePatient(patient.id, patient.time)} style={styles.removeButton}>
                  Done ✓
                </button>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "24px 20px" },
  heading: { fontSize: "24px", fontWeight: "700", color: "#0f172a" },
  subheading: { fontSize: "14px", color: "#64748b", marginTop: "4px", marginBottom: "20px" },
  doctorSelectRow: { display: "flex", gap: "8px", marginBottom: "16px" },
  select: {
    flex: 1, padding: "10px 12px", fontSize: "14px",
    border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#ffffff"
  },
  addDoctorBtn: {
    padding: "10px 14px", fontSize: "13px", fontWeight: "600",
    color: "#2563eb", backgroundColor: "#eff6ff", border: "none",
    borderRadius: "8px", cursor: "pointer"
  },
  addDoctorBox: { backgroundColor: "#f8fafc", padding: "14px", borderRadius: "10px", marginBottom: "16px" },
  nowServingBanner: {
    backgroundColor: "#f0fdf4", border: "2px solid #22c55e",
    borderRadius: "12px", padding: "16px", textAlign: "center", marginBottom: "20px"
  },
  nowServingLabel: { fontSize: "12px", fontWeight: "600", color: "#16a34a", marginBottom: "4px" },
  nowServingToken: { fontSize: "28px", fontWeight: "800", color: "#15803d" },
  nowServingName: { fontSize: "16px", fontWeight: "600", color: "#166534", marginTop: "2px" },
  callNextBtn: {
    width: "100%", padding: "12px", fontSize: "15px", fontWeight: "600",
    color: "#ffffff", backgroundColor: "#16a34a", border: "none",
    borderRadius: "8px", cursor: "pointer", marginBottom: "12px"
  },
  form: { marginBottom: "28px" },
  input: {
    width: "100%", padding: "12px 14px", fontSize: "15px",
    border: "1px solid #cbd5e1", borderRadius: "8px", marginBottom: "12px", outline: "none"
  },
  checkboxLabel: { display: "flex", alignItems: "center", fontSize: "14px", color: "#475569", marginBottom: "12px" },
  checkbox: { marginRight: "8px", width: "16px", height: "16px" },
  button: {
    width: "100%", padding: "12px", fontSize: "15px", fontWeight: "600",
    color: "#ffffff", backgroundColor: "#2563eb", border: "none",
    borderRadius: "8px", cursor: "pointer"
  },
  queueHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" },
  queueTitle: { fontSize: "16px", fontWeight: "700", color: "#0f172a" },
  queueCount: {
    backgroundColor: "#eff6ff", color: "#2563eb", fontWeight: "700",
    fontSize: "13px", padding: "4px 10px", borderRadius: "12px"
  },
  emptyState: { color: "#94a3b8", fontSize: "14px", textAlign: "center", marginTop: "30px" },
  card: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px",
    padding: "14px 16px", marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
  },
  cardName: { fontSize: "15px", fontWeight: "600", color: "#0f172a" },
  cardStatus: { fontSize: "13px", color: "#94a3b8", marginTop: "2px" },
  urgentBadge: {
    backgroundColor: "#fef2f2", color: "#ef4444", fontSize: "11px",
    fontWeight: "700", padding: "2px 8px", borderRadius: "10px", marginLeft: "8px"
  },
  removeButton: {
    backgroundColor: "#f1f5f9", color: "#475569", border: "none",
    padding: "8px 14px", borderRadius: "8px", fontSize: "13px",
    fontWeight: "600", cursor: "pointer"
  }
};