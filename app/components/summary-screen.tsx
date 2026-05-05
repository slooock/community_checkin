import { CalendarDays, Share2, UserCheck } from "lucide-react";

import { memberKinds } from "../constants";
import type { Member } from "../types";
import { formatDate } from "../utils/date";
import { saveSummaryPdf } from "../utils/summary-pdf";
import { DatePickerSheet } from "./date-picker-sheet";

export function SummaryScreen({
  absentMembers,
  isDatePickerOpen,
  openAbsentList,
  presentMembers,
  selectedDate,
  setIsDatePickerOpen,
  setSelectedDate,
  statusMessage,
}: {
  absentMembers: Member[];
  isDatePickerOpen: boolean;
  openAbsentList: () => void;
  presentMembers: Member[];
  selectedDate: string;
  setIsDatePickerOpen: (value: boolean) => void;
  setSelectedDate: (value: string) => void;
  statusMessage: string;
}) {
  const membersCount = presentMembers.length + absentMembers.length;
  const absentCount = Math.max(membersCount - presentMembers.length, 0);
  const percent = membersCount > 0 ? Math.round((presentMembers.length / membersCount) * 100) : 0;
  const distribution = memberKinds.map((kind) => ({
    kind,
    count: presentMembers.filter((member) => member.kind === kind).length,
  }));
  const maxDistribution = Math.max(...distribution.map((item) => item.count), 1);

  function handleShare() {
    saveSummaryPdf({
      absentCount,
      absentMembers,
      distribution,
      membersCount,
      percent,
      presentMembers,
      selectedDate,
    }).catch(() => undefined);
  }

  return (
    <div className="content-wrapper summary-content">
      <header className="screen-header compact">
        <div>
          <h1>Encontro de hoje</h1>
        </div>
      </header>

      <label className="date-picker">
        <CalendarDays size={18} />
        <span>{formatDate(selectedDate)}</span>
        <button
          aria-label="Abrir seletor de data do resumo"
          type="button"
          onClick={() => setIsDatePickerOpen(true)}
        />
      </label>

      {statusMessage ? <div className="status-message">{statusMessage}</div> : null}

      <section className="summary-hero" aria-label="Total de presentes">
        <div className="summary-hero-top">
          <span>Total presente</span>
          <UserCheck size={22} />
        </div>
        <strong>{presentMembers.length}</strong>
        <p>{percent}% dos membros cadastrados chegaram ao encontro.</p>
      </section>

      <section className="summary-stats" aria-label="Totais de presenca">
        <article>
          <span className="came">Vieram</span>
          <strong>{presentMembers.length}</strong>
        </article>
        <button className="summary-stat-button" type="button" onClick={openAbsentList}>
          <span className="absent">Ausentes</span>
          <strong>{absentCount}</strong>
        </button>
      </section>

      <section className="distribution-card" aria-labelledby="distribution-title">
        <h2 id="distribution-title">Distribuição por grupo</h2>
        <div className="distribution-list">
          {distribution.map((item) => (
            <div className="distribution-row" key={item.kind}>
              <span>{item.kind === "Convidado" ? "Convidados" : `${item.kind}s`}</span>
              <div className="distribution-track">
                <div
                  className={`distribution-fill ${item.kind.toLowerCase()}`}
                  style={{ width: `${Math.max((item.count / maxDistribution) * 100, item.count ? 8 : 0)}%` }}
                />
              </div>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <button className="share-summary" type="button" onClick={handleShare}>
        <Share2 size={18} />
        Salvar resumo em PDF
      </button>

      {isDatePickerOpen ? (
        <DatePickerSheet
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onClose={() => setIsDatePickerOpen(false)}
        />
      ) : null}
    </div>
  );
}
