import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Env, TableConfig } from '../types';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function serializeValue(value: unknown): unknown {
  if (Array.isArray(value) || isPlainObject(value)) {
    return JSON.stringify(value);
  }
  return value;
}

function normalizeRow<T extends Record<string, unknown>>(row: T, jsonColumns: string[]): T {
  const normalized: Record<string, unknown> = { ...row };

  for (const column of jsonColumns) {
    const value = normalized[column];
    if (typeof value === 'string') {
      try {
        normalized[column] = JSON.parse(value);
      } catch {
        normalized[column] = value;
      }
    }
  }

  return normalized as T;
}

function getNowIso(): string {
  return new Date().toISOString();
}

function normalizeLimit(rawLimit: string | undefined): number {
  const parsed = Number.parseInt(rawLimit ?? `${DEFAULT_LIMIT}`, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function normalizeOffset(rawOffset: string | undefined): number {
  const parsed = Number.parseInt(rawOffset ?? '0', 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function filterKnownColumns(payload: Record<string, unknown>, config: TableConfig): Record<string, unknown> {
  const known = new Set(config.columns);
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => known.has(key) && value !== undefined)
  );
}

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function validateRecordId(id: string, label = 'id'): string | null {
  if (!isUuid(id)) {
    return `${label} must be a valid UUID`;
  }

  return null;
}

function validateCreatePayload(
  payload: Record<string, unknown>,
  config: TableConfig
): string[] {
  const errors: string[] = [];

  for (const field of config.requiredOnCreate ?? []) {
    const value = payload[field];
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`${field} is required`);
    }
  }

  for (const field of config.uuidFields ?? []) {
    const value = payload[field];
    if (value !== undefined && value !== null) {
      if (typeof value !== 'string' || !isUuid(value)) {
        errors.push(`${field} must be a valid UUID`);
      }
    }
  }

  return errors;
}

function validateUpdatePayload(
  payload: Record<string, unknown>,
  config: TableConfig
): string[] {
  const errors: string[] = [];

  for (const field of config.uuidFields ?? []) {
    if (field === config.pk) continue;

    const value = payload[field];
    if (value !== undefined && value !== null) {
      if (typeof value !== 'string' || !isUuid(value)) {
        errors.push(`${field} must be a valid UUID`);
      }
    }
  }

  return errors;
}

async function readJsonBody(
  c: Context<{ Bindings: Env }>
): Promise<Record<string, unknown> | Response> {
  const contentType = c.req.header('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return c.json({ error: 'content-type must be application/json' }, 415);
  }

  const body = await c.req.json<unknown>();
  if (!isPlainObject(body)) {
    return c.json({ error: 'request body must be a JSON object' }, 400);
  }

  return body;
}

export function createCrudRouter(config: TableConfig): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();
  const jsonColumns = config.jsonColumns ?? [];

  router.get('/', async (c) => {
    const limit = normalizeLimit(c.req.query('limit'));
    const offset = normalizeOffset(c.req.query('offset'));
    const sql = `SELECT * FROM ${config.name} ORDER BY ${config.pk} LIMIT ? OFFSET ?`;
    const result = await c.env.DB.prepare(sql).bind(limit, offset).all<Record<string, unknown>>();

    return c.json({
      table: config.name,
      count: result.results.length,
      items: result.results.map((row) => normalizeRow(row, jsonColumns)),
      limit,
      offset,
    });
  });

  router.get('/:id', async (c) => {
    const { id } = c.req.param();
    const idError = validateRecordId(id, config.pk);
    if (idError) {
      return c.json({ error: idError }, 400);
    }

    const sql = `SELECT * FROM ${config.name} WHERE ${config.pk} = ?`;
    const row = await c.env.DB.prepare(sql).bind(id).first<Record<string, unknown>>();

    if (!row) {
      return c.json({ error: `${config.name} not found`, id }, 404);
    }

    return c.json({
      table: config.name,
      item: normalizeRow(row, jsonColumns),
    });
  });

  router.post('/', async (c) => {
    const parsedBody = await readJsonBody(c);
    if (parsedBody instanceof Response) {
      return parsedBody;
    }

    const body = parsedBody;
    const now = getNowIso();
    const payload = filterKnownColumns({ ...body }, config);
    const validationErrors = validateCreatePayload(payload, config);

    if (validationErrors.length > 0) {
      return c.json({ error: 'validation failed', details: validationErrors }, 400);
    }

    const primaryKeyValue = payload[config.pk];

    if (!primaryKeyValue) {
      payload[config.pk] = crypto.randomUUID();
    } else if (typeof primaryKeyValue !== 'string' || !isUuid(primaryKeyValue)) {
      return c.json({ error: `${config.pk} must be a valid UUID` }, 400);
    }

    if (config.autoTimestamps?.createdAt && payload.created_at === undefined) {
      payload.created_at = now;
    }

    if (config.autoTimestamps?.updatedAt && payload.updated_at === undefined) {
      payload.updated_at = now;
    }

    if (config.columns.includes('upload_date') && payload.upload_date === undefined) {
      payload.upload_date = now;
    }

    if (config.columns.includes('opened_at') && payload.opened_at === undefined) {
      payload.opened_at = now;
    }

    const entries = Object.entries(payload);
    if (entries.length === 0) {
      return c.json({ error: 'request body cannot be empty' }, 400);
    }

    const columns = entries.map(([column]) => column);
    const values = entries.map(([, value]) => serializeValue(value));
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${config.name} (${columns.join(', ')}) VALUES (${placeholders})`;

    await c.env.DB.prepare(sql).bind(...values).run();

    const inserted = await c.env.DB.prepare(
      `SELECT * FROM ${config.name} WHERE ${config.pk} = ?`
    ).bind(payload[config.pk] as string).first<Record<string, unknown>>();

    return c.json(
      {
        table: config.name,
        item: inserted ? normalizeRow(inserted, jsonColumns) : payload,
      },
      201
    );
  });

  router.put('/:id', async (c) => {
    if (config.readOnly) {
      return c.json({ error: `${config.name} is append-only` }, 405);
    }

    const { id } = c.req.param();
    const idError = validateRecordId(id, config.pk);
    if (idError) {
      return c.json({ error: idError }, 400);
    }

    const parsedBody = await readJsonBody(c);
    if (parsedBody instanceof Response) {
      return parsedBody;
    }

    const body = parsedBody;
    const now = getNowIso();
    const payload = filterKnownColumns(body, config);
    const validationErrors = validateUpdatePayload(payload, config);

    if (validationErrors.length > 0) {
      return c.json({ error: 'validation failed', details: validationErrors }, 400);
    }

    delete payload[config.pk];
    delete payload.created_at;

    const updates = Object.entries(payload);
    if (updates.length === 0) {
      return c.json({ error: 'no updatable fields provided' }, 400);
    }

    const setClauses = updates.map(([column]) => `${column} = ?`);
    const values = updates.map(([, value]) => serializeValue(value));

    if (config.autoTimestamps?.updatedAt) {
      setClauses.push('updated_at = ?');
      values.push(now);
    }

    values.push(id);

    const sql = `UPDATE ${config.name} SET ${setClauses.join(', ')} WHERE ${config.pk} = ?`;
    const result = await c.env.DB.prepare(sql).bind(...values).run();

    if ((result.meta.changes ?? 0) === 0) {
      return c.json({ error: `${config.name} not found`, id }, 404);
    }

    const updated = await c.env.DB.prepare(
      `SELECT * FROM ${config.name} WHERE ${config.pk} = ?`
    ).bind(id).first<Record<string, unknown>>();

    return c.json({
      table: config.name,
      item: updated ? normalizeRow(updated, jsonColumns) : { [config.pk]: id },
    });
  });

  router.delete('/:id', async (c) => {
    if (config.supportsDelete === false) {
      return c.json({ error: `${config.name} cannot be deleted` }, 405);
    }

    const { id } = c.req.param();
    const idError = validateRecordId(id, config.pk);
    if (idError) {
      return c.json({ error: idError }, 400);
    }

    const result = await c.env.DB.prepare(
      `DELETE FROM ${config.name} WHERE ${config.pk} = ?`
    ).bind(id).run();

    if ((result.meta.changes ?? 0) === 0) {
      return c.json({ error: `${config.name} not found`, id }, 404);
    }

    return c.json({
      table: config.name,
      deleted: true,
      id,
    });
  });

  return router;
}
