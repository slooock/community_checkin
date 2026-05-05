import type { Member, MemberKind } from "../types";
import { formatDate } from "./date";

export async function saveSummaryPdf({
  absentCount,
  absentMembers,
  distribution,
  membersCount,
  percent,
  presentMembers,
  selectedDate,
}: {
  absentCount: number;
  absentMembers: Member[];
  distribution: Array<{ kind: MemberKind; count: number }>;
  membersCount: number;
  percent: number;
  presentMembers: Member[];
  selectedDate: string;
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 56;

  doc.setFillColor("#0A0A0A");
  doc.rect(0, 0, pageWidth, 132, "F");
  doc.setTextColor("#06B6D4");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("COMUNIDADE", margin, y);

  y += 28;
  doc.setTextColor("#FFFFFF");
  doc.setFontSize(24);
  doc.text("Resumo do encontro", margin, y);

  y += 24;
  doc.setTextColor("#A1A1AA");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(formatDate(selectedDate), margin, y);

  y = 174;
  doc.setTextColor("#0A0A0A");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Visao geral", margin, y);

  y += 26;
  const cards = [
    ["Vieram", String(presentMembers.length)],
    ["Ausentes", String(absentCount)],
    ["Total cadastrado", String(membersCount)],
    ["Presenca", `${percent}%`],
  ];
  cards.forEach(([label, value], index) => {
    const cardWidth = 116;
    const x = margin + index * (cardWidth + 10);
    doc.setFillColor(index === 0 ? "#F3E8FF" : "#F8FAFC");
    doc.roundedRect(x, y, cardWidth, 72, 8, 8, "F");
    doc.setTextColor(index === 0 ? "#7E22CE" : "#334155");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), x + 12, y + 22);
    doc.setTextColor("#0A0A0A");
    doc.setFontSize(22);
    doc.text(value, x + 12, y + 52);
  });

  y += 116;
  doc.setTextColor("#0A0A0A");
  doc.setFontSize(14);
  doc.text("Distribuicao por grupo", margin, y);

  y += 24;
  distribution.forEach((item) => {
    const label = item.kind === "Convidado" ? "Convidados" : `${item.kind}s`;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor("#334155");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#0A0A0A");
    doc.text(String(item.count), pageWidth - margin - 20, y, { align: "right" });
    y += 20;
  });

  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor("#0A0A0A");
  doc.text("Presentes", margin, y);
  y += 24;

  if (presentMembers.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor("#64748B");
    doc.text("Nenhum membro marcado como presente nesta data.", margin, y);
  } else {
    presentMembers.forEach((member, index) => {
      if (y > 760) {
        doc.addPage();
        y = 56;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor("#0A0A0A");
      doc.text(`${index + 1}. ${member.name}`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#64748B");
      doc.text(`${member.kind} · ${member.phone || "Sem telefone"}`, margin + 18, y + 16);
      y += 38;
    });
  }

  y += 16;
  if (y > 720) {
    doc.addPage();
    y = 56;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor("#0A0A0A");
  doc.text("Ausentes", margin, y);
  y += 24;

  if (absentMembers.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor("#64748B");
    doc.text("Nao ha membros ausentes nesta data.", margin, y);
  } else {
    absentMembers.forEach((member, index) => {
      if (y > 760) {
        doc.addPage();
        y = 56;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor("#0A0A0A");
      doc.text(`${index + 1}. ${member.name}`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#64748B");
      doc.text(`${member.kind} · ${member.phone || "Sem telefone"}`, margin + 18, y + 16);
      y += 38;
    });
  }

  doc.save(`resumo-${selectedDate}.pdf`);
}
