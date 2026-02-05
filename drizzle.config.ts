import { type Config } from "drizzle-kit";

import { env } from "~/env";

export default {
  schema: [
    "./src/server/db/auth-schema.ts",
    "./src/server/db/schema.ts",
    "./src/server/db/relations.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  tablesFilter: ["habit-tracker_*"],
} satisfies Config;
