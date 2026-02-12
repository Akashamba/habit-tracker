import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  habit,
  habit_completions,
  type HabitCompletion,
} from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";

export const habits = createTRPCRouter({
  createHabit: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [newHabit] = await ctx.db
          .insert(habit)
          .values({ name: input.name, user_id: ctx.session.user.id })
          .returning();

        if (!newHabit) {
          console.error("Habit creation failed - no habit returned");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create habit - database insert failed",
          });
        }

        return { status: "success", habit: newHabit };
      } catch (error) {
        console.error("Error in habit creation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create habit",
        });
      }
    }),

  getHabits: protectedProcedure.query(async ({ ctx }) => {
    try {
      const habits = await ctx.db.query.habit.findMany({
        where: eq(habit.user_id, ctx.session.user.id),
        with: {
          habit_completions: true,
        },
      });
      //   TODO: get completions for each habit as well

      console.log(`Retrieved ${habits.length} habits`);
      console.log(habits[0]);

      return habits;
    } catch (error) {
      console.error("Error while getting habits:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve habits",
      });
    }
  }),

  deleteHabit: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [deletedHabit] = await ctx.db
          .delete(habit)
          .where(eq(habit.id, input.id))
          .returning();

        console.log(`Deleted habit ${deletedHabit?.name}`);

        return { status: "success", deletedHabit: deletedHabit };
      } catch (error) {
        console.error("Error while deleting habit:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete habit",
        });
      }
    }),

  completeHabit: protectedProcedure
    .input(z.object({ habitId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Enter completion event into completions table
        const [newCompletion] = await ctx.db
          .insert(habit_completions)
          .values({
            habit_id: input.habitId,
          })
          .returning();

        console.log(`Inserted a completion of habit id ${input.habitId}`);

        return newCompletion;
      } catch (error) {
        console.error("Error while marking a completion", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to insert completion",
        });
      }
    }),

  undoComplete: protectedProcedure
    .input(z.object({ completionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Delete completion event from completions table
        await ctx.db
          .delete(habit_completions)
          .where(eq(habit_completions.id, input.completionId));

        console.log(`Deleted a completion of id ${input.completionId}`);

        return { status: "success" };
      } catch (error) {
        console.error("Error while trying to undo a completion", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to undo completion",
        });
      }
    }),

  renameHabit: protectedProcedure
    .input(z.object({ habitId: z.string().uuid(), newName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Delete completion event from completions table
        const [renamedHabit] = await ctx.db
          .update(habit)
          .set({ name: input.newName, updated_at: new Date() })
          .where(eq(habit.id, input.habitId));

        console.log(`Renamed habit`);

        return renamedHabit;
      } catch (error) {
        console.error("Error while trying to undo a completion", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to undo completion",
        });
      }
    }),

  seedCompletions: protectedProcedure
    .input(z.object({ habitId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const completions = generateHabitCompletionsSeed(input.habitId);

      await ctx.db.insert(habit_completions).values(completions);
    }),
});

type HabitCompletionSeed = {
  habit_id: string;
  completedAt: Date;
};

export function generateHabitCompletionsSeed(
  habitId: string,
  opts?: {
    monthsBack?: number; // default 3
    minEvents?: number; // default 18
    maxEvents?: number; // default 55
    maxStreakLen?: number; // default 8
  },
): HabitCompletionSeed[] {
  const monthsBack = opts?.monthsBack ?? 3;
  const minEvents = opts?.minEvents ?? 18;
  const maxEvents = opts?.maxEvents ?? 55;
  const maxStreakLen = opts?.maxStreakLen ?? 8;

  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - monthsBack);

  const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const randomTimeOnDay = (d: Date) => {
    const x = new Date(d);
    x.setUTCHours(randInt(6, 23), randInt(0, 59), randInt(0, 59), 0);
    return x;
  };

  const addDaysUTC = (d: Date, days: number) => {
    const x = new Date(d);
    x.setUTCDate(x.getUTCDate() + days);
    return x;
  };

  const clampToRange = (d: Date) => {
    if (d < start) return new Date(start);
    if (d > now) return new Date(now);
    return d;
  };

  const targetCount = randInt(minEvents, maxEvents);

  // Start somewhere in range
  let cursor = new Date(start);
  cursor = addDaysUTC(
    cursor,
    randInt(
      0,
      Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86400000) - 1),
    ),
  );

  const out: HabitCompletionSeed[] = [];
  const usedDays = new Set<string>();

  const dayKey = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

  while (out.length < targetCount) {
    // Choose whether we do a streak or a gap
    const doStreak = Math.random() < 0.7;

    if (doStreak) {
      const streakLen = randInt(2, maxStreakLen);

      for (let i = 0; i < streakLen && out.length < targetCount; i++) {
        const day = clampToRange(addDaysUTC(cursor, i));
        const key = dayKey(day);

        // Avoid duplicates for same day
        if (!usedDays.has(key)) {
          usedDays.add(key);
          out.push({
            habit_id: habitId,
            completedAt: randomTimeOnDay(day),
          });
        }
      }

      // After streak, jump forward by a gap (break streak)
      cursor = addDaysUTC(cursor, streakLen + randInt(1, 4));
    } else {
      // Random single completion day
      const day = clampToRange(cursor);
      const key = dayKey(day);

      if (!usedDays.has(key)) {
        usedDays.add(key);
        out.push({
          habit_id: habitId,
          completedAt: randomTimeOnDay(day),
        });
      }

      // Jump by 1-6 days to create randomness
      cursor = addDaysUTC(cursor, randInt(1, 6));
    }

    // If we drift past "now", wrap back somewhere earlier in range
    if (cursor > now) {
      cursor = addDaysUTC(
        start,
        randInt(
          0,
          Math.max(
            1,
            Math.floor((now.getTime() - start.getTime()) / 86400000) - 1,
          ),
        ),
      );
    }
  }

  // Sort ascending by completedAt (nice for seeding / debugging)
  out.sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());

  return out;
}
