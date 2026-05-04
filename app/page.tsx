"use client";

import {
  Badge,
  BatteryFull,
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
  Signal,
  Sparkles,
  UserCheck,
  UserPlus,
  Wifi,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type MemberKind = "Adulto" | "Jovem" | "Convidado";

type Member = {
  id: number;
  name: string;
  phone: string;
  kind: MemberKind;
  region: string;
  description: string;
};

type ActiveTab = "cadastro" | "presenca" | "resumo";

const initialMembers: Member[] = [
  {
    id: 1,
    name: "Ana Martins",
    phone: "(11) 99999-9999",
    kind: "Adulto",
    region: "Zona Norte",
    description: "Participa do grupo de recepcao.",
  },
  {
    id: 2,
    name: "Rafael Souza",
    phone: "(11) 98888-4444",
    kind: "Jovem",
    region: "Comunidade",
    description: "Ajuda na organizacao dos encontros.",
  },
  {
    id: 3,
    name: "Bianca Lima",
    phone: "(11) 97777-3333",
    kind: "Convidado",
    region: "Recepcao",
    description: "Convidada pela Ana.",
  },
];

const memberKinds: MemberKind[] = ["Adulto", "Jovem", "Convidado"];

export default function Home() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<MemberKind>("Adulto");
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [activeTab, setActiveTab] = useState<ActiveTab>("cadastro");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("2026-05-04");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [attendanceByDate, setAttendanceByDate] = useState<Record<string, number[]>>({
    "2026-05-04": [1],
    "2026-04-27": [1, 2],
  });

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) return;

    setMembers((current) => [
      {
        id: Date.now(),
        name: trimmedName,
        phone: phone.trim(),
        kind,
        region: kind === "Convidado" ? "Recepcao" : "Comunidade",
        description: description.trim(),
      },
      ...current,
    ]);
    setName("");
    setPhone("");
    setDescription("");
    setKind("Adulto");
    setActiveTab("presenca");
  }

  function togglePresence(memberId: number) {
    setAttendanceByDate((current) => {
      const next = new Set(current[selectedDate] ?? []);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return {
        ...current,
        [selectedDate]: Array.from(next),
      };
    });
  }

  return (
    <main className="phone-shell" aria-label="Aplicacao de comunidade">
      <section className="mobile-screen">
        <StatusBar />

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
          />
        ) : null}

        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
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
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="content-wrapper">
          <header className="screen-header">
            <div>
              <p className="eyebrow">Comunidade</p>
              <h1>Cadastrar membro</h1>
            </div>
            <button className="icon-button" type="button" aria-label="Novo membro">
              <UserPlus size={20} />
            </button>
          </header>

          <div className="announcement">
            <Sparkles size={15} />
            <span>Novo ciclo de presença aberto</span>
          </div>

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
              Salvar membro
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
  togglePresence: (memberId: number) => void;
}) {
  return (
    <div className="content-wrapper attendance-content">
      <header className="screen-header compact">
        <div>
          <p className="eyebrow">Check-in</p>
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

function SummaryScreen({
  members,
  attendanceByDate,
  isDatePickerOpen,
  selectedDate,
  setIsDatePickerOpen,
  setSelectedDate,
}: {
  members: Member[];
  attendanceByDate: Record<string, number[]>;
  isDatePickerOpen: boolean;
  selectedDate: string;
  setIsDatePickerOpen: (value: boolean) => void;
  setSelectedDate: (value: string) => void;
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
          <p className="eyebrow">Resumo</p>
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

function StatusBar() {
  return (
    <div className="status-bar" aria-hidden="true">
      <span>9:41</span>
      <div>
        <Signal size={15} />
        <Wifi size={15} />
        <BatteryFull size={18} />
      </div>
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
          className={activeTab === "resumo" ? "tab active" : "tab"}
          type="button"
          onClick={() => setActiveTab("resumo")}
          aria-current={activeTab === "resumo" ? "page" : undefined}
        >
          <Badge size={18} />
          <span>Resumo</span>
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
