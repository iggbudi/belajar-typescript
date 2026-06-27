const URL = import.meta.env.VITE_TURSO_URL;
const TOKEN = import.meta.env.VITE_TURSO_TOKEN;

const API_HOST = URL.replace(/^libsql:\/\//, 'https://');

interface ExecuteResult {
  cols: { name: string; decltype: string }[];
  rows: unknown[][];
  affected_row_count: number;
  last_insert_rowid: number | null;
  rows_read: number;
  rows_written: number;
  query_duration_ms: number;
}

type Row = Record<string, unknown>;

export async function execute(sql: string, args: unknown[] = []): Promise<{ result: ExecuteResult; rows: Row[] }> {
  const res = await fetch(`${API_HOST}/v2/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql, args } }] }),
  });
  const json = await res.json();
  const item = json.results?.[0];
  if (item?.type === 'error') throw new Error(item.error?.message ?? 'Turso error');
  const result: ExecuteResult = item.response.result;
  const cols = result.cols.map((c) => c.name);
  const rows: Row[] = result.rows.map((r) =>
    Object.fromEntries(cols.map((c, i) => [c, r[i]]))
  );
  return { result, rows };
}
