import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { habit, habit_completions } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
}

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

        return {
          status: "success",
          habit: { ...newHabit, completedDates: [] }, // completedDates is an empty array since the habit was just created
        };
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
          habit_completions: {
            columns: {
              completedAt: true,
            },
          },
        },
      });

      console.log(`Retrieved ${habits.length} habits`);

      // Flatten completions and validate streaks
      const flattenedHabits = habits.map(({ habit_completions, ...habit }) => {
        let validatedStreak = habit.streak;
        if (habit.last_completion_date) {
          const yesterday_date = getYesterdayDate();
          const last_completion_date = new Date(habit.last_completion_date);
          last_completion_date.setHours(0, 0, 0, 0);

          // if the last_completion_date older than yesterday
          if (last_completion_date.getTime() < yesterday_date.getTime()) {
            // only update the data to be sent to the client, not db
            validatedStreak = 0;
            // if last_completion_date is yesterday or today, or there is no last_completion_date, do nothing
          }
        }

        return {
          ...habit,
          streak: validatedStreak,
          completedDates: new Set(
            habit_completions.map(
              ({ completedAt: d }) =>
                `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`,
            ),
          ),
        };
      });

      return flattenedHabits;
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
        // Enter completion event into completions table. Will fail if there is already a completiong for the current day
        const [newCompletion] = await ctx.db
          .insert(habit_completions)
          .values({
            habit_id: input.habitId,
          })
          .returning();

        console.log(`Inserted a completion of habit id ${input.habitId}`);

        const [currentHabit] = await ctx.db
          .select()
          .from(habit)
          .where(eq(habit.id, input.habitId));
        let updated_streak;
        if (currentHabit?.last_completion_date) {
          const last_completion_date = new Date(
            currentHabit?.last_completion_date,
          );
          const yesterday_date = getYesterdayDate();
          if (last_completion_date.getTime() < yesterday_date.getTime()) {
            updated_streak = 1;
          } else {
            updated_streak = currentHabit?.streak + 1;
          }
        } else {
          updated_streak = 1;
        }

        const updated_longest_streak = Math.max(
          currentHabit?.longest_streak!,
          updated_streak,
        );

        await ctx.db
          .update(habit)
          .set({
            last_completion_date: newCompletion?.completedAt
              .toISOString()
              .slice(0, 10),
            streak: updated_streak,
            longest_streak: updated_longest_streak,
          })
          .where(eq(habit.id, input.habitId));

        console.log(`Updated Streak of habit id ${input.habitId}`);

        // Essential for undo
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
});

export type Habit = Awaited<ReturnType<typeof habits.getHabits>>[number];
