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

Iteration 1:

- [ ] Habit actions: create (with moda or inline), view, delete (with confirmation modal)
- [ ] make habit entries

Iteration 2:

- [ ] habit types and theme colors

Iteration 3:

- [ ] connect with notion

### Roadmap for above features

- [x] set up db, auth, hosting
- [x] deploy pipelines
- [ ] finalize a UI, schema, and api endpoints with data signature
- [ ] set up rough trpc outline that returns fake data or set up a seed script with fake data in db
- [ ] develop UI using fake endpoints
- [ ] implement backend

# Daily logs

## Tasks for Jan 29

- [x] set up db for habits project on neon and deploy to vercel (30 mins)
- [x] set up auth for habits project (15 mins)

## Tasks for Feb 2

- [x] try to make better auth sign in on server as implemented in create-t3-app template
- [x] finalize UI on figma

## Tasks for Feb 3

- [ ] make rough sketch of api endpoints
- [ ] set up rough trpc outline that returns fake data or set up a seed script with fake data in db
