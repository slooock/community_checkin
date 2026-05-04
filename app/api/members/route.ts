import { NextResponse } from "next/server";
import { getSql, MemberRow } from "@/lib/db";

export const runtime = "nodejs";

type MemberPayload = {
  name?: string;
  phone?: string;
  kind?: MemberRow["kind"];
  region?: string;
  description?: string;
};

const allowedKinds = new Set(["Adulto", "Jovem", "Convidado"]);

export async function GET() {
  try {
    const sql = getSql();
    const rows = (await sql`
      SELECT id, name, phone, kind, region, description
      FROM members
      ORDER BY id DESC
    `) as MemberRow[];

    return NextResponse.json(rows.map(normalizeMember));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sql = getSql();
    const payload = (await request.json()) as MemberPayload;
    const name = payload.name?.trim();
    const kind = payload.kind;

    if (!name || !kind || !allowedKinds.has(kind)) {
      return NextResponse.json({ error: "Nome e etiqueta sao obrigatorios." }, { status: 400 });
    }

    const region = payload.region?.trim() || (kind === "Convidado" ? "Recepcao" : "Comunidade");
    const rows = (await sql`
      INSERT INTO members (name, phone, kind, region, description)
      VALUES (
        ${name},
        ${payload.phone?.trim() || null},
        ${kind},
        ${region},
        ${payload.description?.trim() || null}
      )
      RETURNING id, name, phone, kind, region, description
    `) as MemberRow[];

    return NextResponse.json(normalizeMember(rows[0]), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const sql = getSql();
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    const payload = (await request.json()) as MemberPayload;
    const name = payload.name?.trim();
    const kind = payload.kind;

    if (!id || !name || !kind || !allowedKinds.has(kind)) {
      return NextResponse.json({ error: "Membro, nome e etiqueta sao obrigatorios." }, { status: 400 });
    }

    const region = payload.region?.trim() || (kind === "Convidado" ? "Recepcao" : "Comunidade");
    const rows = (await sql`
      UPDATE members
      SET
        name = ${name},
        phone = ${payload.phone?.trim() || null},
        kind = ${kind},
        region = ${region},
        description = ${payload.description?.trim() || null}
      WHERE id = ${id}
      RETURNING id, name, phone, kind, region, description
    `) as MemberRow[];

    if (!rows[0]) {
      return NextResponse.json({ error: "Membro nao encontrado." }, { status: 404 });
    }

    return NextResponse.json(normalizeMember(rows[0]));
  } catch (error) {
    return handleRouteError(error);
  }
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

function handleRouteError(error: unknown) {
  console.error("Members API error", error);

  return NextResponse.json(
    { error: "Nao foi possivel processar a requisicao de membros." },
    { status: 500 },
  );
}
