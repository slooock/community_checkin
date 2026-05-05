"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

import { formatMonth, getCalendarDays, startOfMonth, toDateInputValue } from "../utils/date";

export function DatePickerSheet({
  selectedDate,
  setSelectedDate,
  onClose,
}: {
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  onClose: () => void;
}) {
  const [draftDate, setDraftDate] = useState(selectedDate);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(selectedDate));
  const days = getCalendarDays(visibleMonth);
  const today = "2026-05-04";

  function applyDate() {
    setSelectedDate(draftDate);
    onClose();
  }

  function moveMonth(amount: number) {
    const next = new Date(visibleMonth);
    next.setMonth(next.getMonth() + amount);
    setVisibleMonth(toDateInputValue(next));
  }

  function choosePreset(value: string) {
    setDraftDate(value);
    setVisibleMonth(startOfMonth(value));
  }

  return (
    <div className="date-overlay" role="dialog" aria-modal="true" aria-label="Selecionar data">
      <button className="date-scrim" type="button" onClick={onClose} aria-label="Fechar seletor" />
      <section className="date-sheet">
        <div className="sheet-handle" />
        <header className="date-sheet-header">
          <h2>Selecionar data</h2>
          <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <div className="month-row">
          <button type="button" onClick={() => moveMonth(-1)} aria-label="Mes anterior">
            <ChevronLeft size={20} />
          </button>
          <strong>{formatMonth(visibleMonth)}</strong>
          <button type="button" onClick={() => moveMonth(1)} aria-label="Proximo mes">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="weekdays" aria-hidden="true">
          {["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {days.map((day) => (
            <button
              className={[
                "calendar-day",
                day.isCurrentMonth ? "" : "muted",
                day.value === draftDate ? "selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={day.value}
              type="button"
              onClick={() => setDraftDate(day.value)}
            >
              {day.label}
            </button>
          ))}
        </div>

        <div className="date-presets">
          <button className={draftDate === today ? "active" : ""} type="button" onClick={() => choosePreset(today)}>
            Hoje
          </button>
          <button type="button" onClick={() => choosePreset("2026-04-27")}>
            Ultimo encontro
          </button>
        </div>

        <div className="date-actions">
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" onClick={applyDate}>
            Aplicar data
          </button>
        </div>
      </section>
    </div>
  );
}
