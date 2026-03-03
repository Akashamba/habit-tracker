"use client";

import { api } from "~/trpc/react";
import { getLastNdates } from "~/utils/getLastNDays";
import { useEffect, useState } from "react";
import type { Habit } from "~/server/api/routers/habits-router";
import { Button } from "./Button";
import { toast } from "sonner";
import Input from "./Input";
import { EllipsisVertical, Loader2 } from "lucide-react";
import { ScrollToEndX } from "./ScrollToEndX";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Checkbox } from "./checkbox";
import clsx from "clsx";
import { toUTCDateString } from "~/utils/getUTCDate";
import useHabitMutations from "~/hooks/useHabitMutations";

function getMonthStats(completedDates: Set<string>) {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-indexed
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // filter completions for current month
  const currentMonthCompletions = Array.from(completedDates).filter(
    (dateStr) => {
      const d = new Date(dateStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    },
  );

  return `${currentMonthCompletions.length} / ${daysInMonth}`;
}

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
      {habits
        ?.sort((a, b) => a.id.localeCompare(b.id))
        .map((habit) => (
          <Habit data={habit} key={habit.id} />
        ))}
    </div>
  );
};

export default HabitsContainer;

const Habit = ({ data: habit }: { data: Habit }) => {
  const { handleCheckedChange, handleRename, completeHabit, undoComplete } =
    useHabitMutations(habit);

  const [renameHabitMode, setRenameHabitMode] = useState(false);
  const [newHabitName, setNewHabitName] = useState(habit.name);

  const handleRenameKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Escape") {
      setNewHabitName(habit.name);
      setRenameHabitMode(false);
    }
    if (e.key === "Enter") {
      setRenameHabitMode(false);
      if (newHabitName !== habit.name) {
        await handleRename({ newName: newHabitName });
      }
    }
  };

  return (
    <div
      className="habit-card bg-card-bg h-[200px] w-full max-w-sm rounded-xl px-3.5 pt-2 pb-3.5 pl-1"
      key={habit.id}
    >
      {/* Top Row: Habit name and options */}
      <div className="habit-top-row mb-1.5 flex h-[34px] items-center justify-between pr-1 pl-3.5">
        <div className="top-row-left-side flex items-center gap-2">
          <div>
            <Checkbox
              name="habit-checkbox"
              onCheckedChange={handleCheckedChange}
              disabled={completeHabit.isPending || undoComplete.isPending}
              checked={habit.completedDates.has(toUTCDateString(new Date()))}
            />
          </div>

          {/* switch between habit info and rename mode */}
          <div className="flex h-8 items-center">
            {renameHabitMode ? (
              // input to rename habit
              <Input
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                autoFocus
                className="m-0 mr-2 rounded-none border-0 border-none p-0 text-lg font-medium text-white outline-0 focus:ring-0"
                onKeyDown={(e) => handleRenameKeyDown(e)}
                onBlur={() => setRenameHabitMode(false)}
              />
            ) : (
              // habit name
              <div className="flex w-full items-center text-lg font-medium text-[#fff]">
                <span
                  className="max-w-60 cursor-pointer truncate"
                  onClick={() => setRenameHabitMode(true)}
                >
                  {habit.name}
                </span>
              </div>
            )}
          </div>
        </div>

        <HabitDropdownMenu habitId={habit.id} />
      </div>

      {/* Middle Row: Completion Graph */}
      <CompletionGraph data={habit.completedDates} />

      {/* Bottom Row: Stats */}
      <div className="mt-1.5 flex w-full items-center justify-between pl-3.5">
        <div className="text-muted text-xs">
          <span className="font-bold">
            {getMonthStats(habit.completedDates)}
          </span>{" "}
          days this month
        </div>

        <StreakBadge streak={habit.streak} />
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

  // Using the index of the last saturday to render previous weeks as a complete grid and current week as an ongoing row, to match day indicators (M,W,F)
  const lastSatIndex = pastDatesList.findIndex((date) => {
    const [y, m, d] = date.split("-").map((x) => Number(x)) as [
      number,
      number,
      number,
    ];
    return new Date(y, (m - 1) % 12, d).getDay() === 6;
  });

  return (
    <div className="flex gap-1">
      <div className="text-muted flex w-2.5 flex-col items-center gap-y-0.75 overflow-clip text-xs">
        <div className="flex h-3.5 items-center"></div>
        <div className="flex h-3.5 items-center">M</div>
        <div className="flex h-3.5 items-center"></div>
        <div className="flex h-3.5 items-center">W</div>
        <div className="flex h-3.5 items-center"></div>
        <div className="flex h-3.5 items-center">F</div>
        <div className="flex h-3.5 items-center"></div>
      </div>
      <ScrollToEndX className="no-scrollbar">
        <div className="flex h-[116px] w-[900px] flex-col-reverse flex-wrap-reverse items-end gap-x-0 gap-y-0.75">
          {Array.from({ length: 7 - lastSatIndex }, (_, i) => (
            <div key={i} className="h-3.5"></div>
          ))}
          {pastDatesList.slice(0, lastSatIndex).map((d, i) => (
            <CompletionWithTooltip
              key={i}
              index={i}
              date={d}
              completed={completedDates.has(d)}
            />
          ))}
          {pastDatesList
            .slice(lastSatIndex, pastDatesList.length - (7 - lastSatIndex))
            .map((d, i) => (
              <CompletionWithTooltip
                key={i}
                index={i}
                date={d}
                completed={completedDates.has(d)}
              />
            ))}
        </div>
      </ScrollToEndX>
    </div>
  );
};

const CompletionWithTooltip = ({
  index: i,
  date,
  completed,
}: {
  index: number;
  date: string;
  completed: boolean;
}) => {
  const [y, m, d] = date.split("-").map((x) => Number(x)) as [
    number,
    number,
    number,
  ];

  const tooltipDate = new Date(y, (m - 1) % 12, d);

  let horizontalRightPositioning = "";
  if (i < 7) {
    horizontalRightPositioning = "right-0";
  } else if (i >= 7 && i < 14) {
    horizontalRightPositioning = "-right-[50%]";
  } else if (i >= 14 && i < 21) {
    horizontalRightPositioning = "left-[50%] -translate-x-[70%]";
  } else if (i >= 21 && i < 28) {
    horizontalRightPositioning = "left-[50%] -translate-x-[60%]";
  } else {
    horizontalRightPositioning = "left-[50%] -translate-x-[50%]";
  }

  const tooltipStyles = clsx(
    // Base tooltip styling
    "tooltip invisible absolute z-50 w-fit max-w-xs rounded-md px-3 py-1.5 text-xs bg-foreground text-background",

    // Hover behavior
    "group-hover:visible hover:invisible",

    // Vertical positioning
    [0, 1].includes(tooltipDate.getDay()) ? "top-4" : "-top-7.5",

    // Horizontal positioning
    horizontalRightPositioning,
    i >= 336 && "left-auto translate-x-0 left-0",

    // Edge override (end of year)
    // isEndOfYear && "left-[0%] translate-x-[0]",
  );

  return (
    <div className="group relative">
      {/* programmatically determining top and left here to deal with tooltip getting clipped by overflow. todo: deal with this using react's portals instead */}
      <div className={tooltipStyles}>
        {tooltipDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </div>
      <div
        className={`h-3.5 w-3.5 rounded-[0.3rem] ${completed ? "bg-[#07551C]" : "bg-[#383A4C]"}`}
      ></div>
    </div>
  );
};

const HabitDropdownMenu = ({ habitId }: { habitId: string }) => {
  const utils = api.useUtils();

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

  const handleDelete = async () => {
    deleteHabit.mutate(
      { id: habitId },
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="ml-2 text-[#3a3d58] hover:bg-white/5 hover:text-[#d1d1d1] focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-none aria-expanded:bg-white/5 aria-expanded:text-white"
        >
          <EllipsisVertical size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-card-bg w-32 bg-[#020416]"
      >
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="text-white focus:bg-[#0f122d] focus:text-[#bcbcbc]"
            disabled
          >
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled
            className="text-white focus:bg-[#0f122d] focus:text-[#bcbcbc]"
          >
            Stats
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-card-bg" />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleDelete} variant="destructive">
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const StreakBadge = ({ streak }: { streak: number }) => {
  return (
    <div
      className={clsx(
        "flex cursor-default items-center gap-1.5 text-xs",
        streak > 0 ? "text-amber-400" : "text-slate-400",
      )}
    >
      <span className="text-sm">{streak > 0 ? "🔥" : "❄️"}</span>
      <span className="text-xs font-bold">{streak}</span>
      <span className="text-xs font-light">
        {streak !== 1 ? "days" : "day"}
      </span>
    </div>
  );
};
