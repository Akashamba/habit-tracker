"use client";

import { api } from "~/trpc/react";

const Habits = () => {
  const {
    data: habits,
    isLoading: habitsLoading,
    isError: habitsError,
  } = api.habitsRouter.getHabits.useQuery();

  if (habitsLoading) {
    return <div>Loading...</div>;
  }

  if (habitsError) {
    return <div>Error: {habitsError}</div>;
  }

  return (
    <div>
      {habits?.map((habit) => (
        <div key={habit.id} className="m-5">
          <div>{habit.name}</div>
          <ul className="list-disc pl-5">
            {habit.habit_completions.map((completion) => (
              <li>{`${completion.completedAt}`}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Habits;
