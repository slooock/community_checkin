import { CalendarDays, Check, ChevronLeft, MessageCircle } from "lucide-react";

import type { Member } from "../types";
import { formatDate } from "../utils/date";
import { getInitials } from "../utils/member";

export function AbsentMembersScreen({
  absentMembers,
  clearAllAbsentMembers,
  closeAbsentList,
  selectedAbsentIds,
  selectedDate,
  selectAllAbsentMembers,
  sendWhatsAppToSelected,
  toggleAbsentSelection,
}: {
  absentMembers: Member[];
  clearAllAbsentMembers: () => void;
  closeAbsentList: () => void;
  selectedAbsentIds: number[];
  selectedDate: string;
  selectAllAbsentMembers: () => void;
  sendWhatsAppToSelected: () => void;
  toggleAbsentSelection: (memberId: number) => void;
}) {
  const selectedCount = selectedAbsentIds.length;
  const allSelected = absentMembers.length > 0 && selectedCount === absentMembers.length;
  const noneSelected = selectedCount === 0;

  return (
    <div className="absent-screen-shell">
      <div className="content-wrapper absent-content">
        <header className="screen-header absent-header">
          <button
            className="back-chip back-chip-floating"
            type="button"
            onClick={closeAbsentList}
            aria-label="Voltar para o resumo"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="absent-header-copy">
            <h1>Ausentes</h1>
          </div>
        </header>

        <div className="date-picker absent-date-chip">
          <CalendarDays size={18} />
          <span>{formatDate(selectedDate)}</span>
          <MessageCircle size={16} className="absent-date-icon" />
        </div>

        <div className="bulk-actions" aria-label="Acoes em massa">
          <button
            className={allSelected ? "bulk-action active" : "bulk-action"}
            type="button"
            onClick={selectAllAbsentMembers}
            aria-pressed={allSelected}
          >
            Selecionar todos
          </button>
          <button
            className={noneSelected ? "bulk-action active" : "bulk-action"}
            type="button"
            onClick={clearAllAbsentMembers}
            aria-pressed={noneSelected}
          >
            Desselecionar todos
          </button>
        </div>

        <section className="absent-members-list" aria-label="Lista de ausentes">
          {absentMembers.map((member) => {
            const isSelected = selectedAbsentIds.includes(member.id);

            return (
              <button
                className={isSelected ? "absent-member-row selected" : "absent-member-row"}
                key={member.id}
                type="button"
                onClick={() => toggleAbsentSelection(member.id)}
              >
                <div className={`avatar small avatar-${member.kind.toLowerCase()}`}>{getInitials(member.name)}</div>
                <div className="absent-member-info">
                  <strong>{member.name}</strong>
                  <span>{member.phone || "Sem telefone"}</span>
                  <span className={`member-kind kind-${member.kind.toLowerCase()}`}>{member.kind}</span>
                  <small>{member.description || "Sem observacoes adicionais."}</small>
                </div>
                <div className={isSelected ? "selection-indicator checked" : "selection-indicator"}>
                  {isSelected ? <Check size={16} /> : null}
                </div>
              </button>
            );
          })}

          {absentMembers.length === 0 ? (
            <div className="empty-state summary-empty">
              <Check size={22} />
              <strong>Todos vieram</strong>
              <span>Nao ha membros ausentes nesta data.</span>
            </div>
          ) : null}
        </section>
      </div>

      <div className="absent-footer">
        <button
          className="whatsapp-cta"
          type="button"
          onClick={sendWhatsAppToSelected}
          disabled={selectedCount === 0}
        >
          <MessageCircle size={18} />
          Enviar WhatsApp para {selectedCount} selecionados
        </button>
      </div>
    </div>
  );
}
