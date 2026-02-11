import { text, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { createTableWithPrefix } from "./create-table";
import { sql } from "drizzle-orm";

export const habit = createTableWithPrefix("habit", () => ({
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}));

export const habit_completions = createTableWithPrefix(
  "habit_completions",
  () => ({
    id: uuid("id").primaryKey().defaultRandom(),
    habit_id: uuid("habit_id")
      .references(() => habit.id, { onDelete: "cascade" })
      .notNull(),
    completedAt: timestamp("completed_at").notNull().defaultNow(),
  }),
  (table) => [
    uniqueIndex("habit_day_unique").on(
      table.habit_id,
      sql`DATE(${table.completedAt})`,
    ),
  ],
);

export type HabitWithCompletions = typeof habit.$inferSelect;
export type HabitCompletion = typeof habit_completions.$inferSelect;
