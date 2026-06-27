import { createClient } from '@libsql/client/web';

const URL = import.meta.env.VITE_TURSO_URL;
const TOKEN = import.meta.env.VITE_TURSO_TOKEN;

let client: ReturnType<typeof createClient>;

function getClient() {
  if (!client) {
    console.log('Initializing Turso client with URL:', URL.substring(0, 50) + '...');
    client = createClient({
      url: URL,
      authToken: TOKEN,
    });
  }
  return client;
}

type Row = Record<string, unknown>;

export async function execute(sql: string, args: unknown[] = []): Promise<{ result: any; rows: Row[] }> {
  try {
    console.log('Executing query:', { sql: sql.substring(0, 100), argsCount: args.length });

    const client = getClient();
    const result = await client.execute({
      sql,
      args: (args as any[]) || undefined,
    });

    const rows: Row[] = result.rows.map((row) => {
      const obj: Row = {};
      result.columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });

    console.log('Query success:', { rowCount: rows.length, query: sql.substring(0, 50) });
    return { result, rows };
  } catch (err) {
    const error = err as Error;

    // Handle network errors
    if (
      error.message.includes('Failed to fetch') ||
      error.message.includes('CORS') ||
      error.message.includes('network')
    ) {
      console.error('Turso network error:', {
        message: error.message,
        url: URL,
        sql: sql.substring(0, 100),
        possible: 'Network down, invalid URL, or auth token',
      });
      throw new Error('Network error: Tidak bisa terhubung ke database. Periksa koneksi internet atau hubungi admin.');
    }

    // Handle auth errors
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('Turso auth error:', {
        message: error.message,
        url: URL,
      });
      throw new Error('Auth error: Token database tidak valid. Hubungi admin.');
    }

    // Handle query errors
    if (error.message.includes('no such table') || error.message.includes('syntax error')) {
      console.error('Turso query error:', {
        message: error.message,
        sql: sql.substring(0, 100),
      });
      throw new Error(`Query error: ${error.message}`);
    }

    console.error('Turso execute error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      sql: sql.substring(0, 100),
    });
    throw error;
  }
}
