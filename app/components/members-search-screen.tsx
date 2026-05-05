"use client";

import { Badge, Search, Users } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

import type { Member, MemberFilter, MemberKind } from "../types";
import { getInitials } from "../utils/member";
import { EditMemberSheet } from "./edit-member-sheet";

export function MembersSearchScreen({
  closeEditMember,
  editDescription,
  editKind,
  editingMember,
  editName,
  editPhone,
  hasMore,
  isLoadingMore,
  loadMoreResults,
  memberFilter,
  memberSearch,
  membersCount,
  openEditMember,
  results,
  saveEditedMember,
  setEditDescription,
  setEditKind,
  setEditName,
  setEditPhone,
  setMemberFilter,
  setMemberSearch,
  statusMessage,
}: {
  closeEditMember: () => void;
  editDescription: string;
  editKind: MemberKind;
  editingMember: Member | null;
  editName: string;
  editPhone: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreResults: () => void | Promise<void>;
  memberFilter: MemberFilter;
  memberSearch: string;
  membersCount: number;
  openEditMember: (member: Member) => void;
  results: Member[];
  saveEditedMember: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  setEditDescription: (value: string) => void;
  setEditKind: (value: MemberKind) => void;
  setEditName: (value: string) => void;
  setEditPhone: (value: string) => void;
  setMemberFilter: (filter: MemberFilter) => void;
  setMemberSearch: (value: string) => void;
  statusMessage: string;
}) {
  const guestCount = results.filter((member) => member.kind === "Convidado").length;
  const filters: MemberFilter[] = ["Todos", "Adulto", "Jovem", "Convidado"];
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isSentinelVisible, setIsSentinelVisible] = useState(false);

  useEffect(() => {
    const sentinelElement = sentinelRef.current;
    if (!sentinelElement || !hasMore) return;

    const observer = new IntersectionObserver(([entry]) => {
      const isVisible = entry?.isIntersecting ?? false;
      setIsSentinelVisible(isVisible);

      if (isVisible) {
        console.log("Visivel");
        void loadMoreResults();
      }
    });

    observer.observe(sentinelElement);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMoreResults, results.length]);

  return (
    <div className="content-wrapper members-content">
      <header className="screen-header">
        <div>
          <h1>Pesquisar membros</h1>
        </div>
        <div className="count-badge" aria-label={`${membersCount} membros`}>
          <strong>{membersCount}</strong>
          <span>Membros</span>
        </div>
      </header>

      <div className="db-chip">
        <Badge size={16} />
        <span>Busca carregada do banco</span>
      </div>

      {statusMessage ? <div className="status-message">{statusMessage}</div> : null}

      <label className="search-shell">
        <Search size={18} />
        <input
          value={memberSearch}
          onChange={(event) => setMemberSearch(event.target.value)}
          placeholder="Nome, telefone ou descricao"
          type="search"
        />
      </label>

      <div className="member-filters" aria-label="Filtros de membros">
        {filters.map((filter) => (
          <button
            className={memberFilter === filter ? "active" : ""}
            key={filter}
            onClick={() => setMemberFilter(filter)}
            type="button"
          >
            {filter === "Convidado" ? "Convid." : filter === "Todos" ? "Todos" : `${filter}s`}
          </button>
        ))}
      </div>

      <div className="result-summary">
        <Search size={16} />
        <span>
          {results.length} membros encontrados · {guestCount} convidados
        </span>
      </div>

      <section className="member-search-list" aria-label="Resultados da busca">
        {results.map((member) => (
          <button
            className={editingMember?.id === member.id ? "member-search-row selected" : "member-search-row"}
            key={member.id}
            onClick={() => openEditMember(member)}
            type="button"
          >
            <div className="avatar small">{getInitials(member.name)}</div>
            <div>
              <strong>{member.name}</strong>
              <span>{member.phone || "Sem telefone"}</span>
              <span>{member.kind}</span>
              <small>{member.description || "Sem descricao cadastrada."}</small>
            </div>
            <span className="row-chevron">›</span>
          </button>
        ))}

        {results.length === 0 ? (
          <div className="empty-state compact-empty">
            <Users size={22} />
            <strong>Nenhum membro encontrado</strong>
            <span>Tente outro termo ou remova os filtros.</span>
          </div>
        ) : null}

        {results.length > 0 ? (
          <div
            ref={sentinelRef}
            className={`member-list-sentinel ${isSentinelVisible ? "visible" : ""}`}
            aria-label="Sentinela do final da lista"
          >
            {!hasMore ? "Voce chegou ao fim da lista de membros." : null}
          </div>
        ) : null}
      </section>

      {editingMember ? (
        <EditMemberSheet
          closeEditMember={closeEditMember}
          editDescription={editDescription}
          editKind={editKind}
          editName={editName}
          editPhone={editPhone}
          saveEditedMember={saveEditedMember}
          setEditDescription={setEditDescription}
          setEditKind={setEditKind}
          setEditName={setEditName}
          setEditPhone={setEditPhone}
        />
      ) : null}
    </div>
  );
}
