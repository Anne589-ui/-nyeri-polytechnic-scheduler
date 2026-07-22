import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"];

export default function ExportPDF({ classes, rooms, instructors }) {
  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r.name]));
  const instMap = Object.fromEntries(instructors.map(i => [i.id, i.name]));

  const handleExport = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    // Header
    doc.setFillColor(8, 80, 65);
    doc.rect(0, 0, 297, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Nyeri Polytechnic — Class Timetable", 14, 13);

    // Date
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const now = new Date().toLocaleDateString("en-KE", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    doc.text(`Generated: ${now}`, 220, 13);

    // Group classes by day
    let startY = 28;

    DAYS.forEach(day => {
      const dayClasses = classes
        .filter(c => c.day === day)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      if (dayClasses.length === 0) return;

      // Day heading
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(8, 80, 65);
      doc.text(day, 14, startY);
      startY += 4;

      // Table
      autoTable(doc, {
        startY,
        head: [["Course", "Room", "Instructor", "Start", "End", "Duration"]],
        body: dayClasses.map(c => [
          c.course,
          roomMap[c.room_id] ?? `Room #${c.room_id}`,
          instMap[c.instructor_id] ?? `Instructor #${c.instructor_id}`,
          c.start_time,
          c.end_time,
          `${(parseInt(c.end_time) - parseInt(c.start_time))}hr(s)`,
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [8, 80, 65], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [240, 250, 245] },
        margin: { left: 14, right: 14 },
      });

      startY = doc.lastAutoTable.finalY + 10;

      // Add new page if running out of space
      if (startY > 180) {
        doc.addPage();
        startY = 14;
      }
    });

    // Footer on every page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.setFont("helvetica", "normal");
      doc.text(`Nyeri Polytechnic Scheduling Engine · Page ${i} of ${pageCount}`, 14, 205);
    }

    doc.save(`Nyeri_Polytechnic_Timetable_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <button onClick={handleExport} style={styles.btn} title="Download timetable as PDF">
      ⬇ Download PDF
    </button>
  );
}

const styles = {
  btn: {
    height: 36, padding: "0 16px",
    background: "#1a1a2e", color: "#fff",
    border: "none", borderRadius: 8,
    fontSize: 13, fontWeight: 500,
    cursor: "pointer", marginLeft: 8,
  },
};