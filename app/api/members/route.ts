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

export async function GET(request: Request) {
  try {
    const sql = getSql();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const kindParam = searchParams.get("kind");
    const kind = kindParam && allowedKinds.has(kindParam) ? (kindParam as MemberRow["kind"]) : null;
    const limitParam = Number(searchParams.get("limit"));
    const offsetParam = Number(searchParams.get("offset"));
    const hasPaginationRequest =
      searchParams.has("limit") || searchParams.has("offset") || search.length > 0 || Boolean(kind);

    if (!hasPaginationRequest) {
      const rows = (await sql`
        SELECT id, name, phone, kind, region, description
        FROM members
        ORDER BY id DESC
      `) as MemberRow[];

      return NextResponse.json(rows.map(normalizeMember));
    }

    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 12;
    const offset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;
    const searchPattern = `%${search}%`;

    const rows = kind
      ? search
        ? ((await sql`
            SELECT id, name, phone, kind, region, description
            FROM members
            WHERE kind = ${kind}
              AND CONCAT_WS(' ', name, COALESCE(phone, ''), kind, COALESCE(region, ''), COALESCE(description, ''))
                ILIKE ${searchPattern}
            ORDER BY id DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `) as MemberRow[])
        : ((await sql`
            SELECT id, name, phone, kind, region, description
            FROM members
            WHERE kind = ${kind}
            ORDER BY id DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `) as MemberRow[])
      : search
        ? ((await sql`
            SELECT id, name, phone, kind, region, description
            FROM members
            WHERE CONCAT_WS(' ', name, COALESCE(phone, ''), kind, COALESCE(region, ''), COALESCE(description, ''))
              ILIKE ${searchPattern}
            ORDER BY id DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `) as MemberRow[])
        : ((await sql`
            SELECT id, name, phone, kind, region, description
            FROM members
            ORDER BY id DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `) as MemberRow[]);

    const totalRows = kind
      ? search
        ? ((await sql`
            SELECT COUNT(*)::int AS count
            FROM members
            WHERE kind = ${kind}
              AND CONCAT_WS(' ', name, COALESCE(phone, ''), kind, COALESCE(region, ''), COALESCE(description, ''))
                ILIKE ${searchPattern}
          `) as { count: number }[])
        : ((await sql`
            SELECT COUNT(*)::int AS count
            FROM members
            WHERE kind = ${kind}
          `) as { count: number }[])
      : search
        ? ((await sql`
            SELECT COUNT(*)::int AS count
            FROM members
            WHERE CONCAT_WS(' ', name, COALESCE(phone, ''), kind, COALESCE(region, ''), COALESCE(description, ''))
              ILIKE ${searchPattern}
          `) as { count: number }[])
        : ((await sql`
            SELECT COUNT(*)::int AS count
            FROM members
          `) as { count: number }[]);

    const items = rows.map(normalizeMember);
    const totalCount = totalRows[0]?.count ?? 0;

    return NextResponse.json({
      items,
      totalCount,
      hasMore: offset + items.length < totalCount,
    });
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
