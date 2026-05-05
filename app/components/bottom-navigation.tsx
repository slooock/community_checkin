import { Badge, Check, UserPlus, Users } from "lucide-react";

import type { ActiveTab } from "../types";

export function BottomNavigation({
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
