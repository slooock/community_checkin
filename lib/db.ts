import { neon } from "@neondatabase/serverless";

const globalForDb = globalThis as typeof globalThis & {
  neonSql?: ReturnType<typeof neon>;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required database environment variable: ${name}`);
  }

  return value;
}

export function getSql() {
  if (!globalForDb.neonSql) {
    globalForDb.neonSql = neon(getRequiredEnv("DATABASE_URL"));
  }

  return globalForDb.neonSql;
}

export type MemberRow = {
  id: number;
  name: string;
  phone: string | null;
  kind: "Adulto" | "Jovem" | "Convidado";
  region: string | null;
  description: string | null;
};
