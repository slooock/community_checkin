import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

type AttendancePayload = {
  date?: string;
  memberId?: number;
  present?: boolean;
};

function isDate(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;

  if (!isDate(date)) {
    return NextResponse.json({ error: "Data invalida." }, { status: 400 });
  }
  const attendanceDate = date as string;

  const [rows] = await getPool().execute<(RowDataPacket & { member_id: number })[]>(
    `SELECT member_id
     FROM attendance
     WHERE attendance_date = ?
     ORDER BY member_id`,
    [attendanceDate],
  );

  return NextResponse.json({ date: attendanceDate, presentIds: rows.map((row) => row.member_id) });
}

export async function PUT(request: Request) {
  const payload = (await request.json()) as AttendancePayload;

  if (!isDate(payload.date) || !payload.memberId || typeof payload.present !== "boolean") {
    return NextResponse.json({ error: "Presenca invalida." }, { status: 400 });
  }
  const attendanceDate = payload.date as string;
  const memberId = payload.memberId;

  if (payload.present) {
    await getPool().execute(
      `INSERT IGNORE INTO attendance (member_id, attendance_date)
       VALUES (?, ?)`,
      [memberId, attendanceDate],
    );
  } else {
    await getPool().execute(
      `DELETE FROM attendance
       WHERE member_id = ? AND attendance_date = ?`,
      [memberId, attendanceDate],
    );
  }

  return NextResponse.json({ ok: true });
}
