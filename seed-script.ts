// Script to seed Habit and Completions Table for the following habits to test edge cases for streak calculation
// just broken streak
// almost broken streak
// streak test

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import {
  habit,
  habit_completions,
  type HabitCompletion,
} from "~/server/db/schema";

const habitIds = [
  "af501f6b-9954-4ba6-b7ef-6dece58f067b",
  "c1152fb4-b568-49ec-888e-614805381320",
  "dbe9a777-e481-40d9-9f58-78dde9961de8",
];

// need to insert completions from feb 14 onwards (inclusive)
const fakeCompletions: HabitCompletion[] = [];
const habitUpdate: {
  streak: number;
  longest_streak: number;
  last_completion_date: string;
}[] = [];

habitIds.forEach((id, j) => {
  let i;
  for (i = 14; i < 28 + j; i++) {
    fakeCompletions.push({
      id: randomUUID(),
      habit_id: id,
      completedAt: new Date(`2026-02-${i}`),
    });
  }

  habitUpdate.push({
    streak: i - 14,
    longest_streak: i - 14,
    last_completion_date: new Date(fakeCompletions.at(-1)?.completedAt!)
      .toISOString()
      .slice(0, 10),
  });
});

// console.log(fakeCompletions);
// console.log(habitUpdate);

await db.insert(habit_completions).values(fakeCompletions);
habitIds.forEach(async (id, index) => {
  await db
    .update(habit)
    .set({
      ...habitUpdate[index],
    })
    .where(eq(habit.id, id));
});

// await db.delete(habit)
// await db.delete(habit_completions)
