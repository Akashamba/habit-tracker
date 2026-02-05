import { text, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { createTableWithPrefix } from "./create-table";
import { sql } from "drizzle-orm";

export const habit = createTableWithPrefix("habit", () => ({
  id: uuid().primaryKey().defaultRandom(),
  user_id: uuid().references(() => user.id),
  name: text().notNull(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
}));

export const habit_completions = createTableWithPrefix(
  "habit_completions",
  () => ({
    id: uuid().primaryKey().defaultRandom(),
    habit_id: uuid().references(() => habit.id),
    completedAt: timestamp().notNull().defaultNow(),
  }),
  (table) => [
    uniqueIndex().on(table.habit_id, sql`DATE(${table.completedAt})`),
  ],
);
