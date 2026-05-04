import { NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool, MemberRow } from "@/lib/db";

type MemberPayload = {
  name?: string;
  phone?: string;
  kind?: MemberRow["kind"];
  region?: string;
  description?: string;
};

const allowedKinds = new Set(["Adulto", "Jovem", "Convidado"]);

export async function GET() {
  const [rows] = await getPool().query<(MemberRow & RowDataPacket)[]>(
    `SELECT id, name, phone, kind, region, description
     FROM members
     ORDER BY id DESC`,
  );

  return NextResponse.json(rows.map(normalizeMember));
}

export async function POST(request: Request) {
  const payload = (await request.json()) as MemberPayload;
  const name = payload.name?.trim();
  const kind = payload.kind;

  if (!name || !kind || !allowedKinds.has(kind)) {
    return NextResponse.json({ error: "Nome e etiqueta sao obrigatorios." }, { status: 400 });
  }

  const region = payload.region?.trim() || (kind === "Convidado" ? "Recepcao" : "Comunidade");
  const [result] = await getPool().execute<ResultSetHeader>(
    `INSERT INTO members (name, phone, kind, region, description)
     VALUES (?, ?, ?, ?, ?)`,
    [
      name,
      payload.phone?.trim() || null,
      kind,
      region,
      payload.description?.trim() || null,
    ],
  );

  const [rows] = await getPool().execute<(MemberRow & RowDataPacket)[]>(
    `SELECT id, name, phone, kind, region, description
     FROM members
     WHERE id = ?`,
    [result.insertId],
  );

  return NextResponse.json(normalizeMember(rows[0]), { status: 201 });
}

function normalizeMember(member: MemberRow) {
  return {
    id: member.id,
    name: member.name,
    phone: member.phone ?? "",
    kind: member.kind,
    region: member.region ?? "",
    description: member.description ?? "",
  };
}
