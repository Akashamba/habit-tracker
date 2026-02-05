import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient } from "~/trpc/server";

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
      <div className="bg-linear-to-b from-[#2e026d] to-[#15162c]">
        <main className="m-auto flex min-h-screen max-w-sm flex-col items-center justify-center text-white">
          Hello <b>{session?.user.name ?? "Not signed in"}</b>
          {session && (
            <form action={handleSignOut}>
              <button type="submit">Sign Out</button>
            </form>
          )}
          {!session && (
            <form action={handleSignIn}>
              <button type="submit">Sign In</button>
            </form>
          )}
        </main>
      </div>
    </HydrateClient>
  );
}
