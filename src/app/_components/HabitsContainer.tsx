"use client";

import { api } from "~/trpc/react";
import { getLastNdates } from "~/utils/getLastNDays";
import { useEffect, useState } from "react";
import type { Habit } from "~/server/api/routers/habits-router";
import { Button } from "./Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./Dialog";
import { toast } from "sonner";
import Input from "./Input";
import { EditIcon, Loader2 } from "lucide-react";
import { ScrollToEndX } from "./ScrollToEndX";

const HabitsContainer = () => {
  const {
    data: habits,
    isLoading: habitsLoading,
    isError: habitsError,
  } = api.habitsRouter.getHabits.useQuery();

  if (habitsLoading) {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (habitsError) {
    return <div className="text-red">Error: {habitsError}</div>;
  }

  if (habits?.length === 0) {
    return (
      <div className="text-center text-white">
        Get started by creating a new habit!
      </div>
    );
  }

  return (
    <div className="mx-5 flex flex-col items-center gap-5 py-5">
      {habits?.map((habit) => (
        <Habit data={habit} key={habit.id} />
      ))}
    </div>
  );
};

export default HabitsContainer;

const Habit = ({ data: habit }: { data: Habit }) => {
  const [currentDate, setCurrentDate] = useState<string>("");
  const utils = api.useUtils();

  useEffect(() => {
    const d = new Date();
    setCurrentDate(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`,
    );
  }, []);

  const deleteHabit = api.habitsRouter.deleteHabit.useMutation({
    onMutate: async ({ id }) => {
      toast.success("Deleted!");

      await utils.habitsRouter.getHabits.cancel();

      const prev = utils.habitsRouter.getHabits.getData();

      utils.habitsRouter.getHabits.setData(undefined, (old) =>
        old?.filter((h) => h.id !== id),
      );
      return { prev };
    },
  });

  const completeHabit = api.habitsRouter.completeHabit.useMutation({
    onMutate: async ({ habitId }) => {
      await utils.habitsRouter.getHabits.cancel();

      const prev = utils.habitsRouter.getHabits.getData();

      const d = new Date();
      const todayUTC = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

      utils.habitsRouter.getHabits.setData(undefined, (old) =>
        old?.map((h) =>
          h.id === habitId
            ? {
                ...h,
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

      const d = new Date();
      const todayUTC = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

      utils.habitsRouter.getHabits.setData(undefined, (old) =>
        old?.map((h) =>
          h.id === habit.id
            ? {
                ...h,
                completedDates: new Set(
                  [...h.completedDates].filter((d) => d === todayUTC),
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

  const handleDelete = async () => {
    deleteHabit.mutate(
      { id: habit.id },
      {
        onError: (_err, _vars, ctx) => {
          utils.habitsRouter.getHabits.setData(undefined, ctx?.prev);
        },

        onSettled: () => {
          void utils.habitsRouter.getHabits.invalidate();
        },
      },
    );
  };

  const handleComplete = async () => {
    completeHabit.mutate(
      { habitId: habit.id },
      {
        onError: (_err, _vars, ctx) => {
          utils.habitsRouter.getHabits.setData(undefined, ctx?.prev);
        },

        onSuccess: (data) => {
          toast.success("Completed!", {
            action: {
              label: "Undo",
              onClick: () => {
                if (data?.id) {
                  void handleUndo(data?.id);
                }
              },
            },
          });
        },

        onSettled: () => {
          void utils.habitsRouter.getHabits.invalidate();
        },
      },
    );
  };

  const handleUndo = async (id: string) => {
    undoComplete.mutate(
      { completionId: id },
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
  };

  const handleRename = async ({
    id,
    newName,
  }: {
    id: string;
    newName: string;
  }) => {
    renameHabit.mutate(
      { habitId: id, newName: newName },
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

  const [renameHabitMode, setRenameHabitMode] = useState(false);
  const [newHabitName, setNewHabitName] = useState(habit.name);

  return (
    <div
      className="habit-card h-[245px] w-full max-w-sm rounded-xl bg-[#0F143B] p-3"
      key={habit.id}
    >
      <div className="habit-top-row flex items-baseline justify-between pr-1">
        <div className="habit-name flex h-8 items-center">
          {renameHabitMode ? (
            <Input
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              autoFocus
              className="px-2 py-0 text-white"
              onKeyDown={async (e) => {
                if (e.key === "Escape") {
                  setRenameHabitMode(false);
                }
                if (e.key === "Enter") {
                  setRenameHabitMode(false);
                  if (newHabitName !== habit.name) {
                    await handleRename({ id: habit.id, newName: newHabitName });
                  }
                }
              }}
              onBlur={() => setRenameHabitMode(false)}
            />
          ) : (
            <div className="habit-name flex items-center text-[14pt] font-medium text-[#fff]">
              <span>{habit.name}</span>
              <Button
                variant="ghost"
                onClick={() => setRenameHabitMode(true)}
                className="hover:bg-unset text-[#3a3d58] hover:text-[#d1d1d1]"
              >
                <EditIcon size={12} />
              </Button>
            </div>
          )}
        </div>

        <div className="text-white">🔥 {habit.completedDates.size}</div>
      </div>

      <CompletionGraph data={habit.completedDates} />

      <div className="habit-actions mt-3 flex justify-between">
        <div className="flex gap-3">
          <DeleteDialog habitName={habit.name} onClick={handleDelete} />
          <Button onClick={() => alert("Coming soon!")}>Settings</Button>
        </div>

        {habit.completedDates.has(currentDate) ? (
          <Button disabled={true}>🎉 &nbsp; Done</Button>
        ) : (
          <Button className="bg-[#1C7C36]" onClick={handleComplete}>
            Mark as Done
          </Button>
        )}
      </div>
    </div>
  );
};

const CompletionGraph = ({
  data: completedDates,
}: {
  data: Habit["completedDates"];
}) => {
  const [pastDatesList, setPastDatesList] = useState<string[]>([]);
  useEffect(() => {
    setPastDatesList(getLastNdates(371));
  }, []);
  return (
    <ScrollToEndX className="py-2.5">
      <div className="flex h-[125px] w-[1000px] flex-col-reverse flex-wrap-reverse items-end gap-x-0 gap-y-1">
        {pastDatesList.map((d, i) => (
          <div
            key={i}
            className={`h-3.5 w-3.5 rounded-sm ${completedDates.has(d) ? "bg-[#07551C]" : "bg-[#383A4C]"}`}
          ></div>
        ))}
      </div>
    </ScrollToEndX>
  );
};

const DeleteDialog = ({
  habitName,
  onClick: handleDelete,
}: {
  habitName: string;
  onClick: () => Promise<void>;
}) => {
  return (
    <Dialog>
      <DialogContent className="bg-[#0F143B] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Delete Habit</DialogTitle>
          <DialogDescription className="text-[#B9B9B9]">
            Are you sure you want to delete{" "}
            <span className="font-bold">{habitName}</span>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="bg-[#0F143B]">
          <DialogClose asChild>
            <Button>Cancel</Button>
          </DialogClose>
          <Button onClick={handleDelete} type="submit">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
      <DialogTrigger asChild>
        <Button className="text-[#FF5656]">Delete</Button>
      </DialogTrigger>
    </Dialog>
  );
};
