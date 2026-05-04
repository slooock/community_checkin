import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";

type AttendancePayload = {
  date?: string;
  memberId?: number;
  present?: boolean;
};

function isDate(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export async function GET(request: Request) {
  try {
    const sql = getSql();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? undefined;

    if (!isDate(date)) {
      return NextResponse.json({ error: "Data invalida." }, { status: 400 });
    }
    const attendanceDate = date as string;

    const rows = (await sql`
      SELECT member_id
      FROM attendance
      WHERE attendance_date = ${attendanceDate}
      ORDER BY member_id
    `) as { member_id: number }[];

    return NextResponse.json({ date: attendanceDate, presentIds: rows.map((row) => row.member_id) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const sql = getSql();
    const payload = (await request.json()) as AttendancePayload;

    if (!isDate(payload.date) || !payload.memberId || typeof payload.present !== "boolean") {
      return NextResponse.json({ error: "Presenca invalida." }, { status: 400 });
    }
    const attendanceDate = payload.date as string;
    const memberId = payload.memberId;

    if (payload.present) {
      await sql`
        INSERT INTO attendance (member_id, attendance_date)
        VALUES (${memberId}, ${attendanceDate})
        ON CONFLICT (member_id, attendance_date) DO NOTHING
      `;
    } else {
      await sql`
        DELETE FROM attendance
        WHERE member_id = ${memberId} AND attendance_date = ${attendanceDate}
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

function handleRouteError(error: unknown) {
  console.error("Attendance API error", error);

  return NextResponse.json(
    { error: "Nao foi possivel processar a requisicao de presenca." },
    { status: 500 },
  );
}
