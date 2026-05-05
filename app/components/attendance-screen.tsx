import { Check, CirclePlus, Search, UserCheck } from "lucide-react";

import type { Member } from "../types";
import { formatDate } from "../utils/date";
import { getInitials } from "../utils/member";

export function AttendanceScreen({
  filteredMembers,
  membersCount,
  presentCount,
  presentIds,
  progress,
  search,
  selectedDate,
  setSearch,
  statusMessage,
  togglePresence,
}: {
  filteredMembers: Member[];
  membersCount: number;
  presentCount: number;
  presentIds: Set<number>;
  progress: number;
  search: string;
  selectedDate: string;
  setSearch: (value: string) => void;
  statusMessage: string;
  togglePresence: (memberId: number) => void;
}) {
  return (
    <div className="content-wrapper attendance-content">
      <header className="screen-header compact">
        <div>
          <h1>Marcar presença</h1>
          <span className="screen-subtitle">{formatDate(selectedDate)}</span>
        </div>
      </header>

      <label className="search-shell">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar membro"
          type="search"
        />
      </label>

      {statusMessage ? <div className="status-message">{statusMessage}</div> : null}

      <section className="progress-card" aria-label="Progresso de presenca">
        <div className="progress-header">
          <span>Presencas hoje</span>
          <strong>
            {presentCount} <small>/ {membersCount}</small>
          </strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="attendance-list" aria-label="Lista de membros">
        {filteredMembers.map((member) => {
          const isPresent = presentIds.has(member.id);

          return (
            <article className="attendance-row" key={member.id}>
              <div className="avatar small">{getInitials(member.name)}</div>
              <div className="attendance-info">
                <strong>{member.name}</strong>
                <span className={isPresent ? "present-meta" : undefined}>
                  {isPresent ? "Chegou agora" : `${member.kind} · Pendente`}
                </span>
                {member.description ? <small>{member.description}</small> : null}
              </div>
              <button
                className={isPresent ? "presence-button checked" : "presence-button"}
                type="button"
                onClick={() => togglePresence(member.id)}
                aria-label={
                  isPresent
                    ? `Remover presenca de ${member.name}`
                    : `Marcar presenca de ${member.name}`
                }
              >
                {isPresent ? <Check size={18} /> : <CirclePlus size={18} />}
              </button>
            </article>
          );
        })}

        {filteredMembers.length === 0 ? (
          <div className="empty-state">
            <UserCheck size={22} />
            <strong>Nenhum membro encontrado</strong>
            <span>Cadastre ou ajuste a busca para marcar presença.</span>
          </div>
        ) : null}
      </section>
    </div>
  );
}
