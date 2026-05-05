export type MemberKind = "Adulto" | "Jovem" | "Convidado";

export type Member = {
  id: number;
  name: string;
  phone: string;
  kind: MemberKind;
  region: string;
  description: string;
};

export type ActiveTab = "resumo" | "cadastro" | "presenca" | "membros";
export type MemberFilter = "Todos" | MemberKind;
