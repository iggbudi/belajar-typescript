import { createClient } from '@libsql/client/web';

const client = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_TOKEN!,
});

type Row = Record<string, unknown>;

export async function execute(sql: string, args: unknown[] = []): Promise<Row[]> {
  const result = await client.execute({ sql, args: args as any[] });
  return result.rows.map((row) => {
    const obj: Row = {};
    result.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}
