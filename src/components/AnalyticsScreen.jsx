import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

export default function AnalyticsScreen() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [completedVisits, setCompletedVisits] = useState([]);
  const [currentQueue, setCurrentQueue] = useState([]);

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
    if (!selectedDoctor) return;

    const completedRef = ref(db, "completedVisits/" + selectedDoctor);
    onValue(completedRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.values(data) : [];
      setCompletedVisits(list);
    });

    const queueRef = ref(db, "queues/" + selectedDoctor);
    onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.values(data) : [];
      setCurrentQueue(list);
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

  // Today ke visits filter karo
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayVisits = completedVisits.filter(
    (v) => v.completedAt >= todayStart.getTime()
  );

  // Average wait time
  const avgWait =
    todayVisits.length > 0
      ? todayVisits.reduce((sum, v) => sum + v.waitDuration, 0) / todayVisits.length
      : 0;

  // Busiest hour calculate karo
  const hourCounts = {};
  todayVisits.forEach((v) => {
    const hour = new Date(v.completedAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const busiestHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  const formatHour = (h) => {
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:00 ${suffix}`;
  };

  // Bar chart ke liye hours 8AM-8PM
  const chartHours = Array.from({ length: 13 }, (_, i) => i + 8);
  const maxCount = Math.max(...chartHours.map((h) => hourCounts[h] || 0), 1);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Analytics</h1>
      <p style={styles.subheading}>Today's performance overview</p>

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

      {/* Stat Cards */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{todayVisits.length}</div>
          <div style={styles.statLabel}>Patients Today</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{currentQueue.length}</div>
          <div style={styles.statLabel}>Waiting Now</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{formatMinutes(avgWait)}</div>
          <div style={styles.statLabel}>Avg Wait</div>
        </div>
      </div>

      {/* Busiest Hour */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>⏱ Busiest Hour Today</div>
        <div style={styles.busiestBox}>
          {busiestHour
            ? `${formatHour(parseInt(busiestHour[0]))} — ${busiestHour[1]} patient${busiestHour[1] > 1 ? "s" : ""}`
            : "No data yet"}
        </div>
      </div>

      {/* Bar Chart */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>📊 Patients by Hour</div>
        <div style={styles.chart}>
          {chartHours.map((h) => {
            const count = hourCounts[h] || 0;
            const heightPct = (count / maxCount) * 100;
            return (
              <div key={h} style={styles.barWrapper}>
                <div style={styles.barCount}>{count > 0 ? count : ""}</div>
                <div style={styles.barBg}>
                  <div
                    style={{
                      ...styles.barFill,
                      height: heightPct + "%",
                      backgroundColor: count === (busiestHour ? parseInt(busiestHour[1]) : -1)
                        ? "#2563eb"
                        : "#93c5fd"
                    }}
                  />
                </div>
                <div style={styles.barLabel}>{h > 12 ? h - 12 : h}{h >= 12 ? "p" : "a"}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total all time */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>📁 All Time</div>
        <div style={styles.allTimeBox}>
          <span>Total patients served</span>
          <strong>{completedVisits.length}</strong>
        </div>
      </div>
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
    marginBottom: "20px"
  },
  statsRow: { display: "flex", gap: "10px", marginBottom: "24px" },
  statCard: {
    flex: 1,
    backgroundColor: "#eff6ff",
    borderRadius: "12px",
    padding: "16px 10px",
    textAlign: "center"
  },
  statNumber: { fontSize: "20px", fontWeight: "700", color: "#2563eb" },
  statLabel: { fontSize: "11px", color: "#64748b", marginTop: "4px" },
  section: { marginBottom: "24px" },
  sectionTitle: { fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "10px" },
  busiestBox: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "14px 16px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#1e293b"
  },
  chart: { display: "flex", alignItems: "flex-end", gap: "4px", height: "120px", paddingBottom: "24px", position: "relative" },
  barWrapper: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" },
  barCount: { fontSize: "9px", color: "#64748b", height: "14px" },
  barBg: { flex: 1, width: "100%", display: "flex", alignItems: "flex-end", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" },
  barFill: { width: "100%", backgroundColor: "#93c5fd", transition: "height 0.3s ease" },
  barLabel: { fontSize: "9px", color: "#94a3b8", marginTop: "4px" },
  allTimeBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "14px 16px",
    fontSize: "14px",
    color: "#1e293b"
  }
};