"use client";

import { useState } from "react";
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
import { api } from "~/trpc/react";

const QuickMenu = () => {
  const utils = api.useUtils();

  const createHabit = api.habitsRouter.createHabit.useMutation({
    onMutate: async () => {
      await utils.habitsRouter.getHabits.cancel();
    },
  });

  const handleCreateHabit = async (newHabitName: string) => {
    createHabit.mutate(
      { name: newHabitName },
      {
        onSettled: () => {
          void utils.habitsRouter.getHabits.invalidate();
        },
      },
    );
  };

  return (
    <div className="quick-menu scrollbar no-scrollbar mx-5 mb-7 flex gap-3 overflow-x-auto">
      <CreateDialog onClick={handleCreateHabit} />
      <Button>Option 2</Button>
      <Button>Option 3</Button>
      <Button>Option 4</Button>
    </div>
  );
};

export default QuickMenu;

const CreateDialog = ({
  onClick: handleCreate,
}: {
  onClick: (newHabitName: string) => Promise<void>;
}) => {
  const [newHabitName, setNewHabitName] = useState("");
  return (
    <Dialog>
      <DialogContent className="bg-[#0F143B] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Create a New Habit</DialogTitle>
          <DialogDescription className="text-[#B9B9B9]">
            <div className="pb-3">Give your new habit a name</div>
            <form>
              <input
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Enter habit name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await handleCreate(newHabitName);
                }}
              />
            </form>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="bg-[#0F143B]">
          <DialogClose asChild>
            <Button>Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={() => handleCreate(newHabitName)}>Create</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>

      <DialogTrigger asChild>
        <Button>Create New Habit</Button>
      </DialogTrigger>
    </Dialog>
  );
};
