import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { habit, habit_completions } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { toUTCDateISO, toUTCDateString } from "~/utils/getUTCDate";
import { MS_PER_DAY } from "~/utils/constants";

function getTodayDate() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);
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
          last_completion_date.setUTCHours(0, 0, 0, 0);

          // if the last_completion_date older than yesterday
          if (last_completion_date.getTime() < yesterday_date.getTime()) {
            if (habit.name === "almost broken streak") {
              console.log(
                habit.name,
                habit.last_completion_date,
                last_completion_date,
              );
            }
            // only update the data to be sent to the client, not db
            validatedStreak = 0;
            // if last_completion_date is yesterday or today, or there is no last_completion_date, do nothing
          }
        }

        return {
          ...habit,
          streak: validatedStreak,
          completedDates: new Set(
            habit_completions.map(({ completedAt: d }) => toUTCDateString(d)),
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

        const newCompletion = await ctx.db.transaction(async (tx) => {
          // Update Completions table with new completion event
          const [newCompletion] = await tx
            .insert(habit_completions)
            .values({
              habit_id: input.habitId,
            })
            .returning();

          // Update streak, longest streak, and last completion date
          // Also aquiring lock here
          const [currentHabit] = await tx
            .select()
            .from(habit)
            .where(eq(habit.id, input.habitId))
            .for("update");

          // calculate updated streak, either 1 or previous streak + 1
          let updated_streak = 1;
          if (currentHabit?.last_completion_date) {
            const last_completion_date = new Date(
              currentHabit?.last_completion_date,
            );
            const yesterday_date = getYesterdayDate();

            if (last_completion_date.getTime() >= yesterday_date.getTime()) {
              updated_streak = currentHabit?.streak + 1;
            }
          }

          // Longest streak is max of current streak and past longest streak
          const updated_longest_streak = Math.max(
            currentHabit?.longest_streak ?? 0,
            updated_streak,
          );

          // write to db
          await tx
            .update(habit)
            .set({
              last_completion_date: toUTCDateISO(newCompletion?.completedAt),
              streak: updated_streak,
              longest_streak: updated_longest_streak,
            })
            .where(eq(habit.id, input.habitId));

          console.log(`Updated Streak of habit id ${input.habitId}`);

          return newCompletion;
        });

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
    .input(z.object({ habitId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Delete completion event from completions table
        await ctx.db.transaction(async (tx) => {
          const [toDeleteCompletion] = await tx
            .select({
              id: habit_completions.id,
              completedAt: habit_completions.completedAt,
            })
            .from(habit_completions)
            .where(eq(habit_completions.habit_id, input.habitId))
            .orderBy(desc(habit_completions.completedAt))
            .limit(1);

          if (!toDeleteCompletion) {
            throw new Error(
              `Completion to delete not found for habit id ${input.habitId}`,
            );
          }

          const completionDate = new Date(toDeleteCompletion.completedAt);
          completionDate.setUTCHours(0, 0, 0, 0);
          const today_date = getTodayDate();

          if (today_date.getTime() !== completionDate.getTime()) {
            throw new Error("No completions today");
          }

          const [deletedCompletion] = await tx
            .delete(habit_completions)
            .where(eq(habit_completions.id, toDeleteCompletion.id))
            .returning();

          if (!deletedCompletion) {
            throw new Error("Completion not found");
          }

          const [updatedHabit] = await tx
            .select()
            .from(habit)
            .where(eq(habit.id, input.habitId))
            .for("update");

          if (!updatedHabit) {
            throw new Error("Habit not found");
          }

          // decrement streak
          updatedHabit.streak = Math.max(updatedHabit.streak - 1, 0);

          // decrement last completion date, or set to null if no ongoing streak
          if (updatedHabit.streak === 0) {
            updatedHabit.last_completion_date = null;
          } else {
            updatedHabit.last_completion_date = toUTCDateISO(
              new Date(Date.now() - MS_PER_DAY),
            );
          }

          // TODO: update longest_streak correctly when undoing a completion, or leave it as append only field

          await tx
            .update(habit)
            .set({
              streak: updatedHabit.streak,
              last_completion_date: updatedHabit.last_completion_date,
            })
            .where(eq(habit.id, updatedHabit.id));

          console.log(`Deleted a completion of id ${deletedCompletion.id}`);
        });

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
