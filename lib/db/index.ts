import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Single postgres connection for the app. `prepare: false` is required for
// Supabase's transaction pooler (port 6543).
const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
