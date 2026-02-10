import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient } from "~/trpc/server";
import HabitsContainer from "./_components/HabitsContainer";
import QuickMenu from "./_components/QuickMenu";

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
      <main className="min-h-screen bg-[#020416]">
        <nav className="flex flex-col">
          <div className="flex h-[13vh] w-full items-center justify-between bg-linear-to-b from-[#121844] to-[#020416] p-5 text-[#fff]">
            <div className="flex items-end gap-3">
              <div className="mb-2 size-10 rounded-4xl bg-[#76A9D6]">
                {/* insert icon here */}
              </div>
              <div className="title text-[24pt] font-medium">Habits</div>
            </div>
            {session?.user ? (
              // temporary sign out button, will replace with user's profile picture and a sign out modal from shadcn
              <div
                className="mb-2 size-10 cursor-pointer rounded-4xl bg-[#76A9D6]"
                onClick={handleSignOut}
              ></div>
            ) : (
              <button
                className="cursor-pointer rounded bg-[#76A9D6] px-2 py-1 text-white"
                onClick={handleSignIn}
              >
                Sign In
              </button>
            )}
          </div>

          <QuickMenu />
        </nav>

        {session?.user ? (
          <HabitsContainer />
        ) : (
          <div className="text-center text-white">Please sign in</div>
        )}
      </main>
    </HydrateClient>
  );
}
