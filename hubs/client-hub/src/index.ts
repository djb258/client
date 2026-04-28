import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { health } from './routes/health';
import { s1Hub } from './routes/s1-hub';
import { s2Plan } from './routes/s2-plan';
import { s3Employee } from './routes/s3-employee';
import { s4Vendor } from './routes/s4-vendor';
import { s5Service } from './routes/s5-service';

const app = new Hono<{ Bindings: Env }>();

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    maxAge: 86400,
  })
);

app.route('/', health);
app.route('/api/s1', s1Hub);
app.route('/api/s2', s2Plan);
app.route('/api/s3', s3Employee);
app.route('/api/s4', s4Vendor);
app.route('/api/s5', s5Service);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
