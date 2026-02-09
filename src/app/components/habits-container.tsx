"use client";

import { api } from "~/trpc/react";
import Completion from "./completion";

const HabitsContainer = () => {
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
    // <div>
    //   {habits?.map((habit) => (
    //     <div key={habit.id} className="m-5">
    //       <div>{habit.name}</div>
    //       <ul className="list-disc pl-5">
    //         {habit.habit_completions.map((completion) => (
    //           <li>{`${completion.completedAt}`}</li>
    //         ))}
    //       </ul>
    //     </div>
    //   ))}
    // </div>

    <div className="flex flex-col items-center gap-5">
      {habits?.map((habit) => (
        <div className="h-[300px] w-sm max-w-sm overflow-scroll bg-red-100">
          {/* <div className="mx-[30px] mt-[50px] h-[200px] w-[500px] bg-red-500"></div> */}
          <div className="flex h-[175px] w-[1500px] flex-col-reverse flex-wrap-reverse items-end gap-1">
            {Array.from({ length: 371 }, (_, i) => (
              <Completion key={i} completed={i % 3 != 0} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HabitsContainer;
