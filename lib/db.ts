import mysql from "mysql2/promise";

const globalForMysql = globalThis as typeof globalThis & {
  mysqlPool?: mysql.Pool;
};

export function getPool() {
  if (!globalForMysql.mysqlPool) {
    globalForMysql.mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT ?? 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
    });
  }

  return globalForMysql.mysqlPool;
}

export type MemberRow = {
  id: number;
  name: string;
  phone: string | null;
  kind: "Adulto" | "Jovem" | "Convidado";
  region: string | null;
  description: string | null;
};
