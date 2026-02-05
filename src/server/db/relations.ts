import { relations } from "drizzle-orm";
import { habit, habit_completions } from "./schema";

export const habitRelation = relations(habit, ({ many }) => ({
  habit_completions: many(habit_completions),
}));

export const habitCompletionsRelation = relations(
  habit_completions,
  ({ one }) => ({
    habit: one(habit, {
      fields: [habit_completions.habit_id],
      references: [habit.id],
    }),
  }),
);
