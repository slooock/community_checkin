import { Badge, Check, Phone, X } from "lucide-react";
import type { FormEvent } from "react";

import { memberKinds } from "../constants";
import type { MemberKind } from "../types";

export function EditMemberSheet({
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
            <input value={editPhone} onChange={(event) => setEditPhone(event.target.value)} inputMode="tel" />
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
