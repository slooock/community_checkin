"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { membersPageSize } from "./constants";
import { AbsentMembersScreen } from "./components/absent-members-screen";
import { AttendanceScreen } from "./components/attendance-screen";
import { BottomNavigation } from "./components/bottom-navigation";
import { MembersSearchScreen } from "./components/members-search-screen";
import { RegistrationScreen } from "./components/registration-screen";
import { SummaryScreen } from "./components/summary-screen";
import type { ActiveTab, Member, MemberFilter, MemberKind } from "./types";
import { getTodayDate, formatDate } from "./utils/date";
import { getInitials } from "./utils/member";

type PagedMembersResponse = {
  items: Member[];
  totalCount: number;
  hasMore: boolean;
};

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
  const [isAbsentListOpen, setIsAbsentListOpen] = useState(false);
  const [selectedAbsentIds, setSelectedAbsentIds] = useState<number[]>([]);
  const [attendanceByDate, setAttendanceByDate] = useState<Record<string, number[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  const initials = useMemo(() => getInitials(name || "Novo membro"), [name]);
  const presentIds = useMemo(
    () => new Set(attendanceByDate[selectedDate] ?? []),
    [attendanceByDate, selectedDate],
  );
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
  const presentMembers = useMemo(
    () => members.filter((member) => presentIds.has(member.id)),
    [members, presentIds],
  );
  const absentMembers = useMemo(
    () => members.filter((member) => !presentIds.has(member.id)),
    [members, presentIds],
  );
  const presentCount = presentIds.size;
  const progress = members.length > 0 ? Math.round((presentCount / members.length) * 100) : 0;
  const shouldShowBottomNavigation = !isDatePickerOpen && !editingMember && !isAbsentListOpen;

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
        if (!ignore) {
          setIsLoading(false);
        }
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
        const data = await fetchMembersPage(0, memberSearch, memberFilter);
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

  useEffect(() => {
    setSelectedAbsentIds((current) =>
      current.filter((memberId) => absentMembers.some((member) => member.id === memberId)),
    );
  }, [absentMembers]);

  async function loadMoreMemberResults() {
    if (isMemberPageLoading || !memberHasMore) return;

    setIsMemberPageLoading(true);
    try {
      const data = await fetchMembersPage(memberResults.length, memberSearch, memberFilter);

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

  function openAbsentList() {
    setSelectedAbsentIds(absentMembers.map((member) => member.id));
    setIsAbsentListOpen(true);
  }

  function closeAbsentList() {
    setIsAbsentListOpen(false);
  }

  function toggleAbsentSelection(memberId: number) {
    setSelectedAbsentIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    );
  }

  function selectAllAbsentMembers() {
    setSelectedAbsentIds(absentMembers.map((member) => member.id));
  }

  function clearAllAbsentMembers() {
    setSelectedAbsentIds([]);
  }

  function sendWhatsAppToSelected() {
    const selectedMembers = absentMembers.filter((member) => selectedAbsentIds.includes(member.id));
    if (selectedMembers.length === 0) return;

    selectedMembers.forEach((member, index) => {
      const phoneDigits = member.phone.replace(/\D/g, "");
      if (!phoneDigits) return;

      const normalizedPhone = phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`;
      const message = [
        `Oi, ${member.name}.`,
        "",
        `Sentimos sua falta no encontro de ${formatDate(selectedDate)}.`,
        "Quando puder, nos responde para sabermos se esta tudo bem com voce.",
      ].join("\n");

      window.setTimeout(() => {
        window.open(
          `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`,
          "_blank",
          "noopener,noreferrer",
        );
      }, index * 150);
    });
  }

  return (
    <main className="phone-shell" aria-label="Aplicacao de comunidade">
      <section className="mobile-screen">
        {activeTab === "cadastro" ? (
          <RegistrationScreen
            description={description}
            initials={initials}
            isLoading={isLoading}
            kind={kind}
            name={name}
            onSubmit={handleSubmit}
            phone={phone}
            setDescription={setDescription}
            setKind={setKind}
            setName={setName}
            setPhone={setPhone}
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
          isAbsentListOpen ? (
            <AbsentMembersScreen
              absentMembers={absentMembers}
              clearAllAbsentMembers={clearAllAbsentMembers}
              closeAbsentList={closeAbsentList}
              selectedAbsentIds={selectedAbsentIds}
              selectedDate={selectedDate}
              selectAllAbsentMembers={selectAllAbsentMembers}
              sendWhatsAppToSelected={sendWhatsAppToSelected}
              toggleAbsentSelection={toggleAbsentSelection}
            />
          ) : (
            <SummaryScreen
              absentMembers={absentMembers}
              isDatePickerOpen={isDatePickerOpen}
              openAbsentList={openAbsentList}
              presentMembers={presentMembers}
              selectedDate={selectedDate}
              setIsDatePickerOpen={setIsDatePickerOpen}
              setSelectedDate={setSelectedDate}
              statusMessage={statusMessage}
            />
          )
        ) : null}

        {activeTab === "membros" ? (
          <MembersSearchScreen
            closeEditMember={closeEditMember}
            editDescription={editDescription}
            editKind={editKind}
            editingMember={editingMember}
            editName={editName}
            editPhone={editPhone}
            hasMore={memberHasMore}
            isLoadingMore={isMemberPageLoading}
            loadMoreResults={loadMoreMemberResults}
            memberFilter={memberFilter}
            memberSearch={memberSearch}
            membersCount={memberResultsCount}
            openEditMember={openEditMember}
            results={memberResults}
            saveEditedMember={saveEditedMember}
            setEditDescription={setEditDescription}
            setEditKind={setEditKind}
            setEditName={setEditName}
            setEditPhone={setEditPhone}
            setMemberFilter={setMemberFilter}
            setMemberSearch={setMemberSearch}
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

async function fetchMembersPage(offset: number, memberSearch: string, memberFilter: MemberFilter) {
  const params = new URLSearchParams({
    limit: String(membersPageSize),
    offset: String(offset),
  });

  if (memberSearch.trim()) {
    params.set("search", memberSearch.trim());
  }

  if (memberFilter !== "Todos") {
    params.set("kind", memberFilter);
  }

  const response = await fetch(`/api/members?${params.toString()}`);
  if (!response.ok) {
    throw new Error("members-page");
  }

  return (await response.json()) as PagedMembersResponse;
}
