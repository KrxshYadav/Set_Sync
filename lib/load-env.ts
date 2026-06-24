// Side-effect module: load .env.local before any DB module initializes.
// Import this FIRST in standalone scripts (seed, etc.) so DATABASE_URL is set
// before lib/db reads it. (Next.js loads env itself, so the app doesn't need this.)
import { config } from "dotenv";

config({ path: ".env.local" });
