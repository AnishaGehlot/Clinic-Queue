import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

export default function StatusScreen() {
  const [search, setSearch] = useState("");
  const [queue, setQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [avgTime, setAvgTime] = useState(10 * 60 * 1000);
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [nearTurn, setNearTurn] = useState(false);
  const prevPositionRef = useRef(null);

  // Doctors list load karo
  useEffect(() => {
    const doctorsRef = ref(db, "doctors");
    onValue(doctorsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.values(data) : [];
      setDoctors(list);
      if (list.length > 0) setSelectedDoctor(list[0]);
    });
  }, []);

  // Selected doctor ki queue load karo
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

  // Avg time load karo
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

  // Notification + Sound — jab position 2 ya 1 ho jaaye
  useEffect(() => {
    if (!result) return;

    const prev = prevPositionRef.current;
    const curr = result.position;

    if (prev !== null && prev > 2 && curr <= 2) {
      // Sound alert
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = 880;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.8);
      } catch (e) {}

      // Tab title + banner
      setNearTurn(true);
      document.title = "⏰ Your turn soon!";
      setTimeout(() => {
        document.title = "ClinicQ";
        setNearTurn(false);
      }, 8000);
    }

    prevPositionRef.current = curr;
  }, [result]);

  const formatMinutes = (ms) => {
    const totalMinutes = Math.round(ms / 60000);
    if (totalMinutes < 1) return "< 1 min";
    if (totalMinutes < 60) return totalMinutes + " min";
    const hours = Math.floor(totalMinutes / 60);
    const rem = totalMinutes % 60;
    if (rem === 0) return hours + " hr";
    return hours + " hr " + rem + " min";
  };

  const handleSearch = () => {
    setSearched(true);
    const query = search.trim().toLowerCase();
    if (query === "") { setResult(null); return; }

    const index = queue.findIndex(
      (p) =>
        p.name.trim().toLowerCase() === query ||
        (p.token && p.token.toLowerCase() === query)
    );

    if (index === -1) {
      setResult(null);
    } else {
      setResult({ patient: queue[index], position: index + 1, eta: index * avgTime });
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Check My Status</h1>
      <p style={styles.subheading}>Enter your name or token number</p>

      {/* Doctor selector */}
      {doctors.length > 0 && (
        <select
          value={selectedDoctor}
          onChange={(e) => { setSelectedDoctor(e.target.value); setResult(null); setSearched(false); }}
          style={styles.select}
        >
          {doctors.map((doc) => (
            <option key={doc} value={doc}>{doc}</option>
          ))}
        </select>
      )}

      {/* Near turn banner */}
      {nearTurn && (
        <div style={styles.alertBanner}>
          ⏰ Your turn is coming soon! Please be ready.
        </div>
      )}

      <div style={styles.form}>
        <input
          type="text"
          placeholder="e.g. Anisha or A47"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch} style={styles.button}>
          Search
        </button>
      </div>

      {searched && !result && (
        <p style={styles.notFound}>No matching patient found in the queue.</p>
      )}

      {result && (
        <div style={styles.resultCard}>
          <div style={styles.tokenBadge}>{result.patient.token}</div>
          <div style={styles.resultName}>
            {result.patient.name}
            {result.patient.urgent && <span style={styles.urgentBadge}>URGENT</span>}
          </div>

          {result.position <= 2 && (
            <div style={styles.soonBadge}>🔔 Almost your turn!</div>
          )}

          <div style={styles.resultRow}>
            <div style={styles.resultStat}>
              <div style={styles.resultStatNumber}>{result.position}</div>
              <div style={styles.resultStatLabel}>Position</div>
            </div>
            <div style={styles.resultStat}>
              <div style={styles.resultStatNumber}>{formatMinutes(result.eta)}</div>
              <div style={styles.resultStatLabel}>Est. wait</div>
            </div>
          </div>

          <p style={styles.doctorInfo}>Doctor: <strong>{selectedDoctor}</strong></p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "24px 20px" },
  heading: { fontSize: "24px", fontWeight: "700", color: "#0f172a" },
  subheading: { fontSize: "14px", color: "#64748b", marginTop: "4px", marginBottom: "16px" },
  select: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    marginBottom: "16px"
  },
  alertBanner: {
    backgroundColor: "#fef3c7",
    border: "1px solid #f59e0b",
    color: "#92400e",
    fontWeight: "600",
    fontSize: "14px",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
    textAlign: "center"
  },
  form: { marginBottom: "20px" },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "15px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    marginBottom: "12px",
    outline: "none"
  },
  button: {
    width: "100%",
    padding: "12px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: "#2563eb",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },
  notFound: { color: "#94a3b8", fontSize: "14px", textAlign: "center", marginTop: "20px" },
  resultCard: {
    backgroundColor: "#eff6ff",
    borderRadius: "14px",
    padding: "24px",
    textAlign: "center"
  },
  tokenBadge: {
    display: "inline-block",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "14px",
    padding: "6px 16px",
    borderRadius: "20px",
    marginBottom: "12px"
  },
  resultName: { fontSize: "20px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" },
  soonBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontWeight: "600",
    fontSize: "13px",
    padding: "6px 14px",
    borderRadius: "20px",
    display: "inline-block",
    marginBottom: "14px"
  },
  urgentBadge: {
    backgroundColor: "#fef2f2",
    color: "#ef4444",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "10px",
    marginLeft: "8px"
  },
  resultRow: { display: "flex", gap: "12px" },
  resultStat: { flex: 1, backgroundColor: "#ffffff", borderRadius: "10px", padding: "16px" },
  resultStatNumber: { fontSize: "22px", fontWeight: "700", color: "#2563eb" },
  resultStatLabel: { fontSize: "12px", color: "#475569", marginTop: "4px" },
  doctorInfo: { fontSize: "13px", color: "#64748b", marginTop: "14px" }
};