import { Badge, Check, Info, Phone, Sparkles, UserPlus } from "lucide-react";
import type { FormEvent } from "react";

import { memberKinds } from "../constants";
import type { MemberKind } from "../types";

export function RegistrationScreen({
  description,
  initials,
  kind,
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
    </div>
  );
}
