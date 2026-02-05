// app/seed/page.tsx
import { api } from "~/trpc/server";
import { revalidatePath } from "next/cache";
import type { HabitCompletion } from "~/server/db/schema";

const HABIT_NAMES = [
  "Morning meditation",
  "Read for 30 minutes",
  "Exercise",
  "Drink 8 glasses of water",
  "Journal before bed",
  "No phone first hour",
  "Practice gratitude",
  "Learn something new",
  "Connect with a friend",
  "Healthy breakfast",
];

export default async function SeedPage() {
  const habits = await api.habitsRouter.getHabits();

  async function seedHabits(formData: FormData) {
    "use server";
    const count = parseInt(formData.get("count") as string);

    for (let i = 0; i < count; i++) {
      await api.habitsRouter.createHabit({
        name: HABIT_NAMES[i] as string,
      });
    }

    revalidatePath("/seed");
  }

  async function handleDelete(id: string) {
    "use server";
    await api.habitsRouter.deleteHabit({
      id: id,
    });
  }

  async function handleComplete(id: string) {
    "use server";
    const completion = await api.habitsRouter.completeHabit({
      habitId: id,
    });

    console.log("object", completion?.id);
  }

  async function handleSeedCompletions(id: string) {
    "use server";
    await api.habitsRouter.seedCompletions({
      habitId: id,
    });
  }

  async function handleUndo(id: string) {
    "use server";
    await api.habitsRouter.undoComplete({
      completionId: id,
    });
  }

  async function handleRename(id: string, newName: string) {
    "use server";
    await api.habitsRouter.renameHabit({
      habitId: id,
      newName: newName,
    });
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Seed Database</h1>

      <div className="mb-8 space-y-3">
        <form action={seedHabits}>
          <input type="hidden" name="count" value="1" />
          <button
            type="submit"
            className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Add 1 Habit
          </button>
        </form>

        <form action={seedHabits}>
          <input type="hidden" name="count" value="5" />
          <button
            type="submit"
            className="w-full rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Add 5 Habits
          </button>
        </form>

        <form action={seedHabits}>
          <input type="hidden" name="count" value="10" />
          <button
            type="submit"
            className="w-full rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
          >
            Add 10 Habits
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">
          Current Habits ({habits.length})
        </h2>
        {habits.length === 0 ? (
          <p className="text-gray-500">No habits yet. Add some above!</p>
        ) : (
          <ul className="space-y-2">
            {habits.map((habit) => (
              <li key={habit.id} className="rounded bg-gray-100 p-3">
                <div className="font-medium">{habit.name}</div>
                <div className="text-sm text-gray-500">
                  Created: {new Date(habit.created_at).toLocaleDateString()}
                </div>
                <div>
                  <form
                    action={async () => {
                      "use server";
                      await handleDelete(habit.id);
                    }}
                  >
                    <button type="submit" className="cursor-pointer">
                      Delete
                    </button>
                  </form>
                </div>
                <div>
                  <form
                    action={async () => {
                      "use server";
                      await handleComplete(habit.id);
                    }}
                  >
                    <button type="submit" className="cursor-pointer">
                      Complete
                    </button>
                    <div>
                      Completions Count: {habit.habit_completions.length}
                    </div>
                  </form>
                </div>
                <div>
                  <form
                    action={async () => {
                      "use server";
                      await handleSeedCompletions(habit.id);
                    }}
                  >
                    <button type="submit" className="cursor-pointer">
                      Seed Completions
                    </button>
                  </form>
                </div>
                <div>
                  <form
                    action={async () => {
                      "use server";
                      await handleUndo("9a37a992-bb79-4970-b580-3369bc959506");
                    }}
                  >
                    <button type="submit" className="cursor-pointer">
                      Undo Complete
                    </button>
                  </form>
                </div>
                <div>
                  <form
                    action={async () => {
                      "use server";
                      await handleRename(habit.id, "Renamed");
                    }}
                  >
                    <button type="submit" className="cursor-pointer">
                      Rename
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
