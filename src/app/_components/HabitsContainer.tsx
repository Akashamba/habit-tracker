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

const HabitsContainer = () => {
  const {
    data: habits,
    isLoading: habitsLoading,
    isError: habitsError,
  } = api.habitsRouter.getHabits.useQuery();

  if (habitsLoading) {
    return <div className="text-white">Loading...</div>;
  }

  if (habitsError) {
    return <div className="text-white">Error: {habitsError}</div>;
  }

  if (habits?.length === 0) {
    return (
      <div className="text-center text-white">
        Get started by creating a new habit!
      </div>
    );
  }

  return (
    <div className="mx-5 flex flex-col items-center gap-5">
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
      await utils.habitsRouter.getHabits.cancel();

      const prev = utils.habitsRouter.getHabits.getData();

      utils.habitsRouter.getHabits.setData(undefined, (old) =>
        old?.filter((h) => h.id !== id),
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
          utils.habitsRouter.getHabits.invalidate();
        },
      },
    );
  };

  const handleComplete = async () => {
    alert("Coming soon!");
  };

  return (
    <div
      className="habit-card w-full max-w-sm rounded-xl bg-[#0F143B] p-3"
      key={habit.id}
    >
      <div className="habit-name text-[14pt] font-medium text-[#fff]">
        {habit.name}
      </div>

      <CompletionGraph data={habit.completedDates} />

      <div className="habit-actions mt-3 flex justify-between">
        <div className="flex gap-3">
          <DeleteDialog habitName={habit.name} onClick={handleDelete} />
          <Button>Option 1</Button>
        </div>

        {habit.completedDates.has(currentDate) ? (
          <Button className="bg-[#1C7C36]" disabled={true}>
            🎉 &nbsp; Done
          </Button>
        ) : (
          <Button onClick={handleComplete}>Mark as Done</Button>
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
    <div className="w-full overflow-x-scroll py-2.5">
      <div className="flex h-[125px] w-[1000px] flex-col-reverse flex-wrap-reverse items-end gap-x-0 gap-y-1">
        {pastDatesList.map((d, i) => (
          <div
            key={i}
            className={`h-3.5 w-3.5 rounded-sm ${completedDates.has(d) ? "bg-[#07551C]" : "bg-[#383A4C]"}`}
          ></div>
        ))}
      </div>
    </div>
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
