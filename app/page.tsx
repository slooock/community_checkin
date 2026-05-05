"use client";

import {
  Badge,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  CirclePlus,
  X,
  Info,
  Phone,
  Search,
  Share2,
  Sparkles,
  Users,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type MemberKind = "Adulto" | "Jovem" | "Convidado";

type Member = {
  id: number;
  name: string;
  phone: string;
  kind: MemberKind;
  region: string;
  description: string;
};

type ActiveTab = "resumo" | "cadastro" | "presenca" | "membros";
type MemberFilter = "Todos" | MemberKind;

const memberKinds: MemberKind[] = ["Adulto", "Jovem", "Convidado"];
const membersPageSize = 12;

function getTodayDate() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

export default function Home() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<MemberKind>("Adulto");
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("cadastro");
  const [search, setSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState<MemberFilter>("Todos");
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [memberResultsCount, setMemberResultsCount] = useState(0);
  const [memberHasMore, setMemberHasMore] = useState(true);
  const [isMemberPageLoading, setIsMemberPageLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editKind, setEditKind] = useState<MemberKind>("Adulto");
  const [selectedDate, setSelectedDate] = useState(() => getTodayDate());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [attendanceByDate, setAttendanceByDate] = useState<Record<string, number[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const shouldShowBottomNavigation = !isDatePickerOpen && !editingMember;

  const initials = useMemo(() => getInitials(name || "Novo membro"), [name]);
  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return members;

    return members.filter((member) =>
      [member.name, member.phone, member.kind, member.description]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [members, search]);
  const presentIds = useMemo(
    () => new Set(attendanceByDate[selectedDate] ?? []),
    [attendanceByDate, selectedDate],
  );
  const presentCount = presentIds.size;
  const progress = members.length > 0 ? Math.round((presentCount / members.length) * 100) : 0;

  useEffect(() => {
    let ignore = false;

    async function loadMembers() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/members");
        if (!response.ok) throw new Error("members");
        const data = (await response.json()) as Member[];
        if (!ignore) {
          setMembers(data);
          setStatusMessage("");
        }
      } catch {
        if (!ignore) {
          setStatusMessage("Nao foi possivel carregar os membros agora.");
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadMembers();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadAttendance() {
      try {
        const response = await fetch(`/api/attendance?date=${selectedDate}`);
        if (!response.ok) throw new Error("attendance");
        const data = (await response.json()) as { date: string; presentIds: number[] };
        if (!ignore) {
          setAttendanceByDate((current) => ({ ...current, [data.date]: data.presentIds }));
          setStatusMessage("");
        }
      } catch {
        if (!ignore) {
          setAttendanceByDate((current) => ({ ...current, [selectedDate]: current[selectedDate] ?? [] }));
          setStatusMessage("Nao foi possivel carregar presencas desta data.");
        }
      }
    }

    loadAttendance();
    return () => {
      ignore = true;
    };
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab !== "membros") return;

    let ignore = false;

    async function loadInitialMemberPage() {
      setIsMemberPageLoading(true);
      try {
        const params = new URLSearchParams({
          limit: String(membersPageSize),
          offset: "0",
        });

        if (memberSearch.trim()) {
          params.set("search", memberSearch.trim());
        }

        if (memberFilter !== "Todos") {
          params.set("kind", memberFilter);
        }

        const response = await fetch(`/api/members?${params.toString()}`);
        if (!response.ok) throw new Error("members-page");

        const data = (await response.json()) as {
          items: Member[];
          totalCount: number;
          hasMore: boolean;
        };

        if (!ignore) {
          setMemberResults(data.items);
          setMemberResultsCount(data.totalCount);
          setMemberHasMore(data.hasMore);
          setStatusMessage("");
        }
      } catch {
        if (!ignore) {
          setMemberResults([]);
          setMemberResultsCount(0);
          setMemberHasMore(false);
          setStatusMessage("Nao foi possivel carregar a lista de membros agora.");
        }
      } finally {
        if (!ignore) {
          setIsMemberPageLoading(false);
        }
      }
    }

    loadInitialMemberPage();

    return () => {
      ignore = true;
    };
  }, [activeTab, memberFilter, memberSearch]);

  async function loadMoreMemberResults() {
    if (isMemberPageLoading || !memberHasMore) return;

    setIsMemberPageLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(membersPageSize),
        offset: String(memberResults.length),
      });

      if (memberSearch.trim()) {
        params.set("search", memberSearch.trim());
      }

      if (memberFilter !== "Todos") {
        params.set("kind", memberFilter);
      }

      const response = await fetch(`/api/members?${params.toString()}`);
      if (!response.ok) throw new Error("members-page-more");

      const data = (await response.json()) as {
        items: Member[];
        totalCount: number;
        hasMore: boolean;
      };

      setMemberResults((current) => {
        const knownIds = new Set(current.map((member) => member.id));
        const nextItems = data.items.filter((member) => !knownIds.has(member.id));
        return [...current, ...nextItems];
      });
      setMemberResultsCount(data.totalCount);
      setMemberHasMore(data.hasMore);
      setStatusMessage("");
    } catch {
      setStatusMessage("Nao foi possivel carregar mais membros agora.");
    } finally {
      setIsMemberPageLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) return;

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phone,
          kind,
          region: kind === "Convidado" ? "Recepcao" : "Comunidade",
          description,
        }),
      });
      if (!response.ok) throw new Error("create");
      const saved = (await response.json()) as Member;

      setMembers((current) => [saved, ...current]);
      setName("");
      setPhone("");
      setDescription("");
      setKind("Adulto");
      setStatusMessage("");
      setActiveTab("presenca");
    } catch {
      setStatusMessage("Nao foi possivel salvar o membro agora.");
    }
  }

  function togglePresence(memberId: number) {
    const willBePresent = !presentIds.has(memberId);
    setAttendanceByDate((current) => {
      const next = new Set(current[selectedDate] ?? []);
      if (willBePresent) {
        next.add(memberId);
      } else {
        next.delete(memberId);
      }
      return {
        ...current,
        [selectedDate]: Array.from(next),
      };
    });
    fetch("/api/attendance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, memberId, present: willBePresent }),
    }).catch(() => {
      setStatusMessage("Nao foi possivel atualizar a presenca agora.");
    });
  }

  function openEditMember(member: Member) {
    setEditingMember(member);
    setEditName(member.name);
    setEditPhone(member.phone);
    setEditDescription(member.description);
    setEditKind(member.kind);
  }

  function closeEditMember() {
    setEditingMember(null);
  }

  async function saveEditedMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingMember || !editName.trim()) return;

    try {
      const response = await fetch(`/api/members?id=${editingMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          kind: editKind,
          region: editKind === "Convidado" ? "Recepcao" : "Comunidade",
          description: editDescription,
        }),
      });
      if (!response.ok) throw new Error("update");
      const saved = (await response.json()) as Member;
      setMembers((current) => current.map((member) => (member.id === saved.id ? saved : member)));
      setMemberResults((current) => current.map((member) => (member.id === saved.id ? saved : member)));
      setStatusMessage("");
      closeEditMember();
    } catch {
      setStatusMessage("Nao foi possivel editar o membro agora.");
    }
  }

  return (
    <main className="phone-shell" aria-label="Aplicacao de comunidade">
      <section className="mobile-screen">
        {activeTab === "cadastro" ? (
          <RegistrationScreen
            description={description}
            initials={initials}
            kind={kind}
            members={members}
            name={name}
            phone={phone}
            setDescription={setDescription}
            setKind={setKind}
            setName={setName}
            setPhone={setPhone}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            statusMessage={statusMessage}
          />
        ) : null}

        {activeTab === "presenca" ? (
          <AttendanceScreen
            filteredMembers={filteredMembers}
            membersCount={members.length}
            presentCount={presentCount}
            presentIds={presentIds}
            progress={progress}
            search={search}
            selectedDate={selectedDate}
            setSearch={setSearch}
            statusMessage={statusMessage}
            togglePresence={togglePresence}
          />
        ) : null}

        {activeTab === "resumo" ? (
          <SummaryScreen
            members={members}
            attendanceByDate={attendanceByDate}
            isDatePickerOpen={isDatePickerOpen}
            selectedDate={selectedDate}
            setIsDatePickerOpen={setIsDatePickerOpen}
            setSelectedDate={setSelectedDate}
            statusMessage={statusMessage}
          />
        ) : null}

        {activeTab === "membros" ? (
          <MembersSearchScreen
            memberFilter={memberFilter}
            memberSearch={memberSearch}
            membersCount={memberResultsCount}
            results={memberResults}
            hasMore={memberHasMore}
            isLoadingMore={isMemberPageLoading}
            editingMember={editingMember}
            editDescription={editDescription}
            editKind={editKind}
            editName={editName}
            editPhone={editPhone}
            closeEditMember={closeEditMember}
            openEditMember={openEditMember}
            saveEditedMember={saveEditedMember}
            setEditDescription={setEditDescription}
            setEditKind={setEditKind}
            setEditName={setEditName}
            setEditPhone={setEditPhone}
            setMemberFilter={setMemberFilter}
            setMemberSearch={setMemberSearch}
            loadMoreResults={loadMoreMemberResults}
            statusMessage={statusMessage}
          />
        ) : null}

        {shouldShowBottomNavigation ? (
          <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        ) : null}
      </section>
    </main>
  );
}

function RegistrationScreen({
  description,
  initials,
  kind,
  members,
  name,
  phone,
  setDescription,
  setKind,
  setName,
  setPhone,
  onSubmit,
  isLoading,
  statusMessage,
}: {
  description: string;
  initials: string;
  kind: MemberKind;
  members: Member[];
  name: string;
  phone: string;
  setDescription: (value: string) => void;
  setKind: (value: MemberKind) => void;
  setName: (value: string) => void;
  setPhone: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  isLoading: boolean;
  statusMessage: string;
}) {
  return (
    <div className="content-wrapper">
          <header className="screen-header">
            <div>
              <h1>Cadastrar membro</h1>
            </div>
            <button className="icon-button" type="button" aria-label="Novo membro">
              <UserPlus size={20} />
            </button>
          </header>

          <div className="announcement">
            <Sparkles size={15} />
            <span>{isLoading ? "Conectando ao banco..." : "Novo ciclo de presença aberto"}</span>
          </div>

          {statusMessage ? <div className="status-message">{statusMessage}</div> : null}

          <form className="registration-card" onSubmit={onSubmit}>
            <label className="field-group">
              <span>Nome completo</span>
              <div className="input-shell">
                <Badge size={18} />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex: Ana Martins"
                  autoComplete="name"
                />
              </div>
            </label>

            <label className="field-group">
              <span>Telefone</span>
              <div className="input-shell">
                <Phone size={18} />
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(11) 99999-9999"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
            </label>

            <label className="field-group">
              <span>Descricao do membro</span>
              <textarea
                className="textarea-shell"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ex: participa do louvor, veio por indicacao, precisa de acompanhamento..."
                rows={3}
              />
            </label>

            <fieldset className="kind-picker" aria-label="Tipo de membro">
              {memberKinds.map((item) => (
                <button
                  className={item === kind ? "kind-chip active" : "kind-chip"}
                  key={item}
                  onClick={() => setKind(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </fieldset>

            <div className="note">
              <Info size={18} />
              <p>Use as etiquetas para organizar grupos e convidados.</p>
            </div>

            <div className="preview-row" aria-label="Previa do cadastro">
              <div className="avatar">{initials}</div>
              <div>
                <strong>{name || "Novo membro"}</strong>
                <span>{kind} · {phone || "Sem telefone"}</span>
                {description ? <small>{description}</small> : null}
              </div>
            </div>

            <button className="primary-action" type="submit">
              <Check size={18} />
              Adicionar
            </button>
          </form>

          <section className="recent-section" aria-labelledby="recent-title">
            <h2 id="recent-title">Ultimos cadastrados</h2>
            <div className="recent-list">
              {members.slice(0, 3).map((member) => (
                <article className="member-row" key={member.id}>
                  <div className="avatar small">{getInitials(member.name)}</div>
                  <div>
                    <strong>{member.name}</strong>
                    <span>
                      {member.kind} · {member.region}
                    </span>
                    {member.description ? <small>{member.description}</small> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
    </div>
  );
}

function AttendanceScreen({
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

function MembersSearchScreen({
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
            {isLoadingMore
              ? "Carregando mais membros..."
              : hasMore
                ? isSentinelVisible
                  ? "Fim da lista visivel"
                  : "Role ate o fim da lista"
                : "Todos os membros foram carregados"}
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

function EditMemberSheet({
  closeEditMember,
  editDescription,
  editKind,
  editName,
  editPhone,
  saveEditedMember,
  setEditDescription,
  setEditKind,
  setEditName,
  setEditPhone,
}: {
  closeEditMember: () => void;
  editDescription: string;
  editKind: MemberKind;
  editName: string;
  editPhone: string;
  saveEditedMember: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  setEditDescription: (value: string) => void;
  setEditKind: (value: MemberKind) => void;
  setEditName: (value: string) => void;
  setEditPhone: (value: string) => void;
}) {
  return (
    <div className="edit-overlay" role="dialog" aria-modal="true" aria-label="Editar membro">
      <button className="edit-scrim" type="button" onClick={closeEditMember} aria-label="Fechar edição" />
      <form className="edit-sheet" onSubmit={saveEditedMember}>
        <div className="sheet-handle" />
        <header className="edit-sheet-header">
          <h2>Editar membro</h2>
          <button className="sheet-close" type="button" onClick={closeEditMember} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <label className="field-group">
          <span>Nome completo</span>
          <div className="input-shell">
            <Badge size={18} />
            <input value={editName} onChange={(event) => setEditName(event.target.value)} />
          </div>
        </label>

        <label className="field-group">
          <span>Telefone</span>
          <div className="input-shell">
            <Phone size={18} />
            <input
              value={editPhone}
              onChange={(event) => setEditPhone(event.target.value)}
              inputMode="tel"
            />
          </div>
        </label>

        <fieldset className="kind-picker edit-kind-picker" aria-label="Categoria do membro">
          {memberKinds.map((item) => (
            <button
              className={item === editKind ? "kind-chip active" : "kind-chip"}
              key={item}
              onClick={() => setEditKind(item)}
              type="button"
            >
              {item === "Convidado" ? "Convid." : item}
            </button>
          ))}
        </fieldset>

        <label className="field-group">
          <span>Descrição do membro</span>
          <textarea
            className="textarea-shell"
            value={editDescription}
            onChange={(event) => setEditDescription(event.target.value)}
            rows={3}
          />
        </label>

        <div className="edit-actions">
          <button type="button" onClick={closeEditMember}>
            Cancelar
          </button>
          <button type="submit">
            <Check size={18} />
            Atualizar
          </button>
        </div>
      </form>
    </div>
  );
}

function SummaryScreen({
  members,
  attendanceByDate,
  isDatePickerOpen,
  selectedDate,
  setIsDatePickerOpen,
  setSelectedDate,
  statusMessage,
}: {
  members: Member[];
  attendanceByDate: Record<string, number[]>;
  isDatePickerOpen: boolean;
  selectedDate: string;
  setIsDatePickerOpen: (value: boolean) => void;
  setSelectedDate: (value: string) => void;
  statusMessage: string;
}) {
  const presentIds = useMemo(
    () => new Set(attendanceByDate[selectedDate] ?? []),
    [attendanceByDate, selectedDate],
  );
  const presentMembers = members.filter((member) => presentIds.has(member.id));
  const absentMembers = members.filter((member) => !presentIds.has(member.id));
  const absentCount = Math.max(members.length - presentMembers.length, 0);
  const percent = members.length > 0 ? Math.round((presentMembers.length / members.length) * 100) : 0;
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
      membersCount: members.length,
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
        <article>
          <span className="absent">Ausentes</span>
          <strong>{absentCount}</strong>
        </article>
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

      <section className="present-mini-list" aria-label="Presentes recentes">
        <h2>Presentes</h2>
        {presentMembers.length > 0 ? (
          <div className="recent-list">
            {presentMembers.slice(0, 3).map((member) => (
              <article className="member-row" key={member.id}>
                <div className="avatar small">{getInitials(member.name)}</div>
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.kind} · Confirmado</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state compact-empty">
            <UserCheck size={22} />
            <strong>Ninguem marcado ainda</strong>
            <span>Use a aba Presenca para marcar quem chegou.</span>
          </div>
        )}
      </section>

      <section className="absent-mini-list" aria-label="Membros ausentes">
        <h2>Ausentes</h2>
        {absentMembers.length > 0 ? (
          <div className="recent-list">
            {absentMembers.slice(0, 4).map((member) => (
              <article className="member-row absent-row" key={member.id}>
                <div className="avatar small muted-avatar">{getInitials(member.name)}</div>
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.kind} · Ausente</span>
                  {member.description ? <small>{member.description}</small> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state compact-empty">
            <Check size={22} />
            <strong>Todos vieram</strong>
            <span>Nao ha membros ausentes nesta data.</span>
          </div>
        )}
      </section>

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

function DatePickerSheet({
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
          <button
            className={draftDate === today ? "active" : ""}
            type="button"
            onClick={() => choosePreset(today)}
          >
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

function BottomNavigation({
  activeTab,
  setActiveTab,
}: {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}) {
  return (
    <nav className="bottom-nav" aria-label="Navegacao principal">
      <div className="bottom-pill">
        <button
          className={activeTab === "resumo" ? "tab active" : "tab"}
          type="button"
          onClick={() => setActiveTab("resumo")}
          aria-current={activeTab === "resumo" ? "page" : undefined}
        >
          <Badge size={18} />
          <span>Resumo</span>
        </button>
        <button
          className={activeTab === "cadastro" ? "tab active" : "tab"}
          type="button"
          onClick={() => setActiveTab("cadastro")}
          aria-current={activeTab === "cadastro" ? "page" : undefined}
        >
          <UserPlus size={18} />
          <span>Cadastro</span>
        </button>
        <button
          className={activeTab === "presenca" ? "tab active" : "tab"}
          type="button"
          onClick={() => setActiveTab("presenca")}
          aria-current={activeTab === "presenca" ? "page" : undefined}
        >
          <Check size={18} />
          <span>Presenca</span>
        </button>
        <button
          className={activeTab === "membros" ? "tab active" : "tab"}
          type="button"
          onClick={() => setActiveTab("membros")}
          aria-current={activeTab === "membros" ? "page" : undefined}
        >
          <Users size={18} />
          <span>Membros</span>
        </button>
      </div>
    </nav>
  );
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(".", "");
}

function formatMonth(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function startOfMonth(value: string) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(1);
  return toDateInputValue(date);
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCalendarDays(monthValue: string) {
  const firstDay = new Date(`${monthValue}T12:00:00`);
  firstDay.setDate(1);
  const mondayBasedOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - mondayBasedOffset);

  return Array.from({ length: 21 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      value: toDateInputValue(date),
      label: String(date.getDate()),
      isCurrentMonth: date.getMonth() === firstDay.getMonth(),
    };
  });
}

async function saveSummaryPdf({
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
