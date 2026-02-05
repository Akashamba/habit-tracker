# Akash's Habit Tracker App

## Brainstorming

- the goal is to build a simple habit tracker using a github contribution-graph-like heatmap to be able to track consistency across habits
- user must be authed to view habits
- show all habits on one screen, upto 10 at a time, then implement pagination
- in addition to habits, also display streak for each habit
- however, not all habits need to be done daily, and this shouldn't affect the streak score, so there need to be types of habits (can start with daily, once a week, weekdays only, weekends only) and skipping non-required days shouldn't affect the streak.
- habits should be re-orderable, and configurable: clicking on the settings button for a habit should flip the habit card and reveal settings
- settings can include habit type (daily, etc) and also fun things like theme color maybe
- at a later stage, can add a kind of dashboard view to see all habits / stats at a glance

- new idea: connect with notion: each green square represents an entry on a notion db that is a journal entry about how I fulfulled the habit that day

### Feb 4: what does the habit completions heatmap look like

- Stay as close to github's implementation as possible
- show months, no days
- show last 365 days only.

#### store and retrieve habit completions from db

- initial idea was to store completions as a binary string (eg: "01011110101111") as a column in the habit table
- while this will probably work forever for my scale, I want to build something ready for large scale anyway.

_Production Ready Approach:_

- A dedicated table for `Habit_Completions`
- Stores completion events in the form "User X completed Habit Y on Date Z", ensuring that there can only be one entry for a habit on a day by the user.
- Retrieve completions of a user as "Get all completion dates (limited to the last 365 days) by User X for Habit Y"
- Not sure yet how I will parse this data and then feed it into the heatmap, probably with a map like ({"2026-02-04": true})

#### calculating streaks

- moving streaks to next iteration
- simple implementation idea to add streaks with undo: https://www.notion.so/akashamba/Habit-Tracker-app-2f75aa83c5cb8044a2e9d71af69d1a98?source=copy_link#2fd5aa83c5cb805d9b8df02963a85e0f

---

### Stack

- nextjs
- taiwlind css
- maybe shadcn components
- likely will use a pre built component for the contribution graph
- trpc
- postgres db
- auth using google sso
- hosted on vercel

### Targeted features

Iteration 1: (deadline Friday, Feb 6)

- [ ] Habit actions: create (with modal or inline), view, delete (with confirmation modal)
- [ ] make habit entries

Iteration 1.5: (deadline Sunday, Feb 8)

- [ ] streaks

Iteration 2:

- [ ] Habit settings menu (with card flipping animation)
- [ ] habit types/frequency
- [ ] theme colors
- [ ] Reorder habits
- [ ] Archive habits
- [ ] Batch features (batch complete, delete)
- [ ] Timezone support for using across multiple regions

Iteration 3:

- [ ] connect with notion to make journal entries about each completion
- [ ] email reminders

### Roadmap for above features

- [x] set up db, auth, hosting
- [x] deploy pipelines
- [ ] finalize a UI, schema, and api endpoints with data signature
- [ ] set up rough trpc outline that returns fake data or set up a seed script with fake data in db
- [ ] develop UI using fake endpoints
- [ ] implement backend

## Schema

User ( _cretaed by better-auth already_ )

Habit (
id: uuid, primary_key,
user_id: uuid, foreign_key,
name: string,
created_at: timestamp,
updated_at: timestamp,
)

Habit_Completions (
id: uuid, primary_key,
habit_id: uuid, foreign_key,
completed_at: timestamp
)
Index: UNIQUE(habit_id, date)

## API Layer

- GET: Fetch all habits (with completions)

- POST: Create a new habit
- - Params: habit_name

- DELETE: Delete a habit
- - Params: habit_id

- POST: mark habit as complete
- - Params: habit_id

- POST: undo completion
- - Params: habit_id

- PATCH: update habit (rename now, later archive/unarchive, etc)
- - Params: habit_id, new_name

# Daily logs

## Tasks for Jan 29

- [x] set up db for habits project on neon and deploy to vercel (30 mins)
- [x] set up auth for habits project (15 mins)

## Tasks for Feb 2

- [x] try to make better auth sign in on server as implemented in create-t3-app template
- [x] finalize UI on figma

## Tasks for Feb 4

- [x] make rough sketch of schema
- [x] make rough sketch of api endpoints

## Tasks for Feb 5

- [x] set up trpc router
- [x] set up a seed script with fake data in db

# Known Issues

- [ ] db push when there are tables already fails because of the sql expression column in the UNIQUE constraint of the habit_completions schema
