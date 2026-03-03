import { toast } from "sonner";
import { api } from "~/trpc/react";
import { toUTCDateString } from "~/utils/getUTCDate";
import type { Habit } from "~/server/api/routers/habits-router";
import { MS_PER_DAY } from "~/utils/constants";

export default function useHabitMutations(habit: Habit) {
  const utils = api.useUtils();

  const completeHabit = api.habitsRouter.completeHabit.useMutation({
    onMutate: async ({ habitId }) => {
      await utils.habitsRouter.getHabits.cancel();
      const prev = utils.habitsRouter.getHabits.getData();
      const todayUTC = toUTCDateString(new Date());

      utils.habitsRouter.getHabits.setData(undefined, (old) =>
        old?.map((h) =>
          h.id === habitId
            ? {
                ...h,
                streak: h.streak + 1,
                last_completion_date: toUTCDateString(new Date()),
                completedDates: new Set([...h.completedDates, todayUTC]),
              }
            : h,
        ),
      );
      return { prev };
    },
  });

  const undoComplete = api.habitsRouter.undoComplete.useMutation({
    onMutate: async () => {
      await utils.habitsRouter.getHabits.cancel();
      const prev = utils.habitsRouter.getHabits.getData();
      const todayUTC = toUTCDateString(new Date());

      utils.habitsRouter.getHabits.setData(undefined, (old) =>
        old?.map((h) =>
          h.id === habit.id
            ? {
                ...h,
                streak: h.streak - 1,
                last_completion_date:
                  // extract to separate function if logic grows
                  h.streak - 1 > 0
                    ? toUTCDateString(new Date(Date.now() - MS_PER_DAY))
                    : null,
                completedDates: new Set(
                  [...h.completedDates].filter((d) => d !== todayUTC),
                ),
              }
            : h,
        ),
      );
      return { prev };
    },
  });

  const renameHabit = api.habitsRouter.renameHabit.useMutation({
    onMutate: async ({ habitId, newName }) => {
      await utils.habitsRouter.getHabits.cancel();

      const prev = utils.habitsRouter.getHabits.getData();

      utils.habitsRouter.getHabits.setData(undefined, (old) =>
        old?.map((h) =>
          h.id === habitId
            ? {
                ...h,
                name: newName,
              }
            : h,
        ),
      );
      return { prev };
    },
  });

  const handleCheckedChange = async () => {
    // Complete or undo today's completion
    if (!habit.completedDates.has(toUTCDateString(new Date()))) {
      completeHabit.mutate(
        { habitId: habit.id },
        {
          onError: (_err, _vars, ctx) => {
            utils.habitsRouter.getHabits.setData(undefined, ctx?.prev);
          },

          onSuccess: () => {
            toast.success("Completed!");
          },

          onSettled: () => {
            void utils.habitsRouter.getHabits.invalidate();
          },
        },
      );
    } else {
      undoComplete.mutate(
        { habitId: habit.id },
        {
          onError: (_err, _vars, ctx) => {
            utils.habitsRouter.getHabits.setData(undefined, ctx?.prev);
          },

          onSuccess: () => {
            toast.success("Marked not done");
          },

          onSettled: () => {
            void utils.habitsRouter.getHabits.invalidate();
          },
        },
      );
    }
  };

  const handleRename = async ({ newName }: { newName: string }) => {
    renameHabit.mutate(
      { habitId: habit.id, newName: newName },
      {
        onError: (_err, _vars, ctx) => {
          utils.habitsRouter.getHabits.setData(undefined, ctx?.prev);
        },

        onSuccess: () => {
          toast.success("Renamed");
        },

        onSettled: () => {
          void utils.habitsRouter.getHabits.invalidate();
        },
      },
    );
  };

  return { handleCheckedChange, handleRename, completeHabit, undoComplete };
}
