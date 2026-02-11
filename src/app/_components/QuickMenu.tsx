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

import { toast } from "sonner";
import Input from "./Input";

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
          toast.success("Created new habit");
          void utils.habitsRouter.getHabits.invalidate();
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="quick-menu scrollbar no-scrollbar mx-5 mb-5 flex gap-3 overflow-x-auto">
        <CreateDialog onClick={handleCreateHabit} />
        <Button onClick={() => alert("Coming soon!")}>Stats</Button>
        <Button onClick={() => alert("Coming soon!")}>Social</Button>
        <Button onClick={() => alert("Coming soon!")}>Compact View</Button>
        <Button onClick={() => alert("Coming soon!")}>Select Habits</Button>
      </div>
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
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    await handleCreate(newHabitName);
    setOpen(false);
    setNewHabitName("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#0F143B] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Create a New Habit</DialogTitle>
          <DialogDescription className="text-[#B9B9B9]">
            Give your new habit a name
            <Input
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Enter habit name"
              onKeyDown={async (e) => {
                if (e.key === "Enter" && newHabitName.trim()) {
                  await handleSubmit();
                }
              }}
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="bg-[#0F143B]">
          <DialogClose asChild>
            <Button>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Create</Button>
        </DialogFooter>
      </DialogContent>

      <DialogTrigger asChild>
        <Button>Create New Habit</Button>
      </DialogTrigger>
    </Dialog>
  );
};
