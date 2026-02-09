"use client";

import { api } from "~/trpc/react";
import Completion from "./completion";
import { getLastNdates } from "~/utils/getLastNDays";
import { useEffect, useState } from "react";

const HabitsContainer = () => {
  const {
    data: habits,
    isLoading: habitsLoading,
    isError: habitsError,
  } = api.habitsRouter.getHabits.useQuery();

  const [pastDatesList, setPastDatesList] = useState<String[]>([]);

  useEffect(() => {
    setPastDatesList(getLastNdates(371));
  }, []);

  if (habitsLoading) {
    return <div>Loading...</div>;
  }

  if (habitsError) {
    return <div>Error: {habitsError}</div>;
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {habits?.map((habit) => (
        <div
          className="h-[300px] w-sm max-w-sm overflow-scroll bg-red-100"
          key={habit.id}
        >
          {habit.name} {habit.completedDates.size}
          <div className="flex h-[175px] w-[1500px] flex-col-reverse flex-wrap-reverse items-end gap-1">
            {pastDatesList.map((d, i) => (
              <Completion
                key={i}
                completed={habit.completedDates.has(d as string)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HabitsContainer;
