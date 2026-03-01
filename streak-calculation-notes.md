# Existing Schema

export const habit = createTableWithPrefix("habit", () => ({
id: uuid("id").primaryKey().defaultRandom(),
user_id: text("user_id")
.references(() => user.id, { onDelete: "cascade" })
.notNull(),
name: text("name").notNull(),
created_at: timestamp("created_at").notNull().defaultNow(),
updated_at: timestamp("updated_at").notNull().defaultNow(),
}));

export const habit_completions = createTableWithPrefix(
"habit_completions",
() => ({
id: uuid("id").primaryKey().defaultRandom(),
habit_id: uuid("habit_id")
.references(() => habit.id, { onDelete: "cascade" })
.notNull(),
completedAt: timestamp("completed_at").notNull().defaultNow(),
}),
(table) => [
uniqueIndex("habit_day_unique").on(
table.habit_id,
sql`DATE(${table.completedAt})`,
),
],
);

# Outline of what I am going to make

## Schema Changes

- update habit schema:
  - column for last_completion_date as DATE
  - column for streak as INTEGER with notNull()
  - column for longest_streak as INTEGER with notNull()
    - update all fields with timestamp datatype to include timezone (completions schema also since completedAt uses full date)

## Guarantees

- there will be only one completion per day
- the write path must re-derive streak validity from last_completion_date, never trust the raw streak value blindly.

## Algorithm

- on each read:
  - if the last_completion_date === null: do nothing (the habit has never had a completion)
  - if the last_completion_date older than yesterday: set streak to 0, but do not update db, just the data sent to client
  - else if the last_completion_date is yesterday or today: do nothing
  - return habits data to client
  - no need to validate longest streak here

- on each completion:
  - ensure last_completion_date != today
  - update Completion table (already doing this)
  - update Habit table
    1. update streak in Habit table
       - if last_completion_date was before yesterday: streak = 1
       - else (if last_completion_date was yesterday, since it is guaranteed to not be today): streak += 1
    - if new streak > longest_streak: longest_streak = streak
    2. update last_completion_date in Habit table to today

### ToDos

- ensure concurrency through transactions and row level lock
- standardize today and yesterday in the backend
- add timezones down the line (store user timezone on user table and render habits based on their home timezone)

# Implementation Steps

[X] update schema
[X] push schema
[x] seed db with fake completions for the three habits, one with an ongoing streak, one with a streak about to break, and one with a streak that just broke.
[x] seed db with appropriate streak values to test with
[x] move logic from script to routers
[x] test
[ ] add transaction and locks
[ ] run one time script to manually calculate and update streaks, longest streaks, and last_completion_date for all habits
[ ] create logic for undo complete
