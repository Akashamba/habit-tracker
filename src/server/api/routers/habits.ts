import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { habit, habit_completions } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

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
});
