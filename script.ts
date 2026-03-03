// script testing read-with-streak-validation and complete-habit logic with streak implementation

const TODAY = "2026-02-16T00:27:34.140Z";

function updateDb() {
  return;
}

function updateCompletionTable() {
  return;
}

function readHabits() {
  return [
    {
      id: "e212a959-dd20-413f-a32a-7a8a5a893b72",
      user_id: "BZlm2kehkCumiiiuIInV2Ogk3Mh3ucS0",
      name: "Streak test",
      created_at: "2026-02-12T06:43:18.941Z",
      updated_at: "2026-02-13T17:23:34.912Z",
      last_completion_date: "2026-02-13T00:27:34.140Z",
      streak: 12,
      habit_completions: [
        {
          completedAt: "2025-11-15T12:44:55.000Z",
        },
        {
          completedAt: "2025-11-27T21:26:14.000Z",
        },
        {
          completedAt: "2025-12-07T13:08:33.000Z",
        },
        {
          completedAt: "2025-12-10T18:13:15.000Z",
        },
        {
          completedAt: "2025-12-13T19:30:04.000Z",
        },
        {
          completedAt: "2025-12-16T22:35:08.000Z",
        },
        {
          completedAt: "2025-12-18T22:00:24.000Z",
        },
        {
          completedAt: "2025-12-19T21:37:24.000Z",
        },
        {
          completedAt: "2025-12-20T19:14:55.000Z",
        },
        {
          completedAt: "2025-12-21T18:13:20.000Z",
        },
        {
          completedAt: "2025-12-24T18:29:12.000Z",
        },
        {
          completedAt: "2025-12-25T19:24:45.000Z",
        },
        {
          completedAt: "2025-12-26T19:56:58.000Z",
        },
        {
          completedAt: "2025-12-27T09:10:27.000Z",
        },
        {
          completedAt: "2025-12-28T21:31:30.000Z",
        },
        {
          completedAt: "2026-01-04T21:04:13.000Z",
        },
        {
          completedAt: "2026-01-05T19:54:47.000Z",
        },
        {
          completedAt: "2026-01-06T07:16:40.000Z",
        },
        {
          completedAt: "2026-01-07T20:52:38.000Z",
        },
        {
          completedAt: "2026-01-08T08:22:42.000Z",
        },
        {
          completedAt: "2026-01-10T09:05:12.000Z",
        },
        {
          completedAt: "2026-01-11T09:06:56.000Z",
        },
        {
          completedAt: "2026-01-12T20:55:47.000Z",
        },
        {
          completedAt: "2026-01-13T19:05:04.000Z",
        },
        {
          completedAt: "2026-01-14T19:04:35.000Z",
        },
        {
          completedAt: "2026-01-16T21:29:03.000Z",
        },
        {
          completedAt: "2026-01-17T21:47:26.000Z",
        },
        {
          completedAt: "2026-01-18T10:28:27.000Z",
        },
        {
          completedAt: "2026-01-19T08:04:11.000Z",
        },
        {
          completedAt: "2026-01-21T07:34:10.000Z",
        },
        {
          completedAt: "2026-01-22T09:33:12.000Z",
        },
        {
          completedAt: "2026-01-23T08:00:10.000Z",
        },
        {
          completedAt: "2026-01-24T07:18:50.000Z",
        },
        {
          completedAt: "2026-01-25T08:11:17.000Z",
        },
        {
          completedAt: "2026-01-26T10:04:43.000Z",
        },
        {
          completedAt: "2026-01-27T09:47:21.000Z",
        },
        {
          completedAt: "2026-02-02T21:51:27.000Z",
        },
        {
          completedAt: "2026-02-03T19:20:40.000Z",
        },
        {
          completedAt: "2026-02-04T10:06:54.000Z",
        },
        {
          completedAt: "2026-02-05T08:17:39.000Z",
        },
        {
          completedAt: "2026-02-06T22:04:00.000Z",
        },
        {
          completedAt: "2026-02-07T07:41:55.000Z",
        },
        {
          completedAt: "2026-02-08T18:45:48.000Z",
        },
        {
          completedAt: "2026-02-09T20:30:01.000Z",
        },
        {
          completedAt: "2026-02-10T17:57:51.000Z",
        },
        {
          completedAt: "2026-02-11T09:54:05.000Z",
        },
        {
          completedAt: "2026-02-12T07:03:58.000Z",
        },
        {
          completedAt: "2026-02-13T05:27:34.140Z",
        },
      ],
    },
  ];
}

function getHabitsFromDb() {
  const habits = readHabits();

  const today = new Date("2026-02-15T00:27:34.140Z");
  const yesterday = new Date(TODAY);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);

  habits.forEach((h) => {
    // if the last_completion_date === null, there is no streak (streak = 0)
    if (!h.last_completion_date) {
      return;
    }

    const last_completion_date = new Date(h.last_completion_date);
    last_completion_date.setUTCHours(0, 0, 0, 0);

    // if the last_completion_date older than yesterday
    if (last_completion_date.getTime() < yesterday.getTime()) {
      // only update the data to be sent to the client, not db
      h.streak = 0;
    }
    // if completion date is yesterday or today, do nothing
  });

  return habits;
}

function markHabitComplete(habitId: string): any[] {
  const habits = readHabits();
  const today = new Date(TODAY);
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);

  habits.map((h) => {
    const last_completion_date = new Date(h.last_completion_date);
    last_completion_date.setUTCHours(0, 0, 0, 0);

    if (h.id === habitId) {
      if (last_completion_date.getTime() !== today.getTime()) {
        updateCompletionTable();
        if (last_completion_date.getTime() < yesterday.getTime()) {
          h.streak = 1;
        } else {
          h.streak += 1;
        }

        h.last_completion_date = today.toISOString();
      }
    }

    return h;
  });

  return habits;
}

let habits = getHabitsFromDb();
habits.forEach((h) => {
  console.log(h.streak);
});

habits = markHabitComplete("e212a959-dd20-413f-a32a-7a8a5a893b72");
habits.forEach((h) => {
  console.log(h.streak);
});
