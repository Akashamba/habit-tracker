import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";
import HabitsContainer from "./components/habits-container";

export default async function Home() {
  const session = await getSession();

  async function handleSignOut() {
    "use server";
    await auth.api.signOut({
      headers: await headers(),
    });
  }

  async function handleSignIn() {
    "use server";
    const res = await auth.api.signInSocial({
      body: {
        provider: "google",
        callbackURL: "/",
      },
    });

    if (!res.url) {
      throw new Error("No URL returned from signInSocial");
    }

    redirect(res.url);
  }

  return (
    <HydrateClient>
      <main>
        <nav className="flex w-screen justify-evenly">
          <div className="logo">X</div>
          <div className="title">Habits</div>
          <div className="user-logo">X</div>
        </nav>

        <div className="quick-menu m-5 flex gap-3 overflow-scroll">
          <button className="border border-black p-2">Option 1</button>
          <button className="border border-black p-2">Option 2</button>
          <button className="border border-black p-2">Option 3</button>
        </div>

        <HabitsContainer />
      </main>
    </HydrateClient>
  );
}
