import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Single postgres pool for the app. `prepare: false` works with Supabase's
// pooler; `max: 5` stays well under the session pooler's client limit.
// Reuse one pool across dev hot-reloads (otherwise each reload leaks a pool
// and eventually exhausts the pooler).
const connectionString = process.env.DATABASE_URL!;

const globalForDb = globalThis as unknown as {
  _pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb._pgClient ?? postgres(connectionString, { prepare: false, max: 5 });

if (process.env.NODE_ENV !== "production") globalForDb._pgClient = client;

export const db = drizzle(client, { schema });
