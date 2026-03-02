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
  const [currentDate, setCurrentDate] = useState<string>("");
  const utils = api.useUtils();

  useEffect(() => {
    const d = new Date();
    setCurrentDate(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`,
    );
  }, []);

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
                streak: h.streak + 1,
                last_completion_date: new Date().toISOString().slice(0, 10),
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
                streak: h.streak - 1,
                last_completion_date:
                  h.streak - 1 > 0
                    ? new Date(Date.now() - 86400000).toISOString().slice(0, 10)
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
    alert("Hello!");
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

  const [renameHabitMode, setRenameHabitMode] = useState(false);
  const [newHabitName, setNewHabitName] = useState(habit.name);

  return (
    <div
      className="habit-card h-[200px] w-full max-w-sm rounded-xl bg-[#0F143B] px-3.5 pt-2 pb-3.5 pl-1"
      key={habit.id}
    >
      <div className="habit-top-row flex h-[34px] items-center justify-between pr-1 pl-3.5">
        <div className="top-row-left-side flex items-center gap-2">
          <div>
            <Checkbox
              name="habit-checkbox"
              onCheckedChange={handleCheckedChange}
              checked={habit.completedDates.has(currentDate)}
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
                className="m-0 mr-2 rounded-none border-0 border-none p-0 text-[14pt] font-medium text-white outline-0 focus:ring-0"
                onKeyDown={async (e) => {
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
                }}
                onBlur={() => setRenameHabitMode(false)}
              />
            ) : (
              // habit name
              <div className="flex w-full items-center text-[14pt] font-medium text-[#fff]">
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

      <div className="mt-1 flex gap-1">
        <div className="flex w-2.5 flex-col items-center gap-y-0.75 overflow-clip text-xs text-[#686b82]">
          <div className="flex h-3.5 items-center"></div>
          <div className="flex h-3.5 items-center">M</div>
          <div className="flex h-3.5 items-center"></div>
          <div className="flex h-3.5 items-center">W</div>
          <div className="flex h-3.5 items-center"></div>
          <div className="flex h-3.5 items-center">F</div>
          <div className="flex h-3.5 items-center"></div>
        </div>

        <CompletionGraph data={habit.completedDates} />
      </div>

      <div className="my-2.5 flex w-full justify-between pl-3.5">
        <div></div>

        <div
          className={clsx(
            "flex cursor-default items-center gap-1.5 text-xs",
            habit.streak > 0 ? "text-[#fbbf24]" : "text-slate-400",
          )}
        >
          <span className="text-sm">{habit.streak > 0 ? "🔥" : "❄️"}</span>
          <span className="text-xs font-bold">{habit.streak}</span>
          <span className="text-xs font-light">
            {habit.streak !== 1 ? "days" : "day"}
          </span>
        </div>
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
        className="w-32 border-[#0F143B] bg-[#020416]"
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
        <DropdownMenuSeparator className="bg-[#0F143B]" />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleDelete} variant="destructive">
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
