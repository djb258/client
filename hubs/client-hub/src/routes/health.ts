import { Hono } from 'hono';
import type { Env } from '../types';

export const health = new Hono<{ Bindings: Env }>();

health.get('/health', async (c) => {
  const dbCheck = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
  const tableCount = await c.env.DB.prepare(
    "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
  ).first<{ count: number }>();

  return c.json({
    status: 'ok',
    worker: 'client-hub',
    database: {
      reachable: dbCheck?.ok === 1,
      table_count: tableCount?.count ?? 0,
    },
    timestamp: new Date().toISOString(),
  });
});
