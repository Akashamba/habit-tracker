import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient } from "~/trpc/server";
import HabitsContainer from "./_components/HabitsContainer";
import QuickMenu from "./_components/QuickMenu";
import { Button } from "./_components/Button";
import type { User } from "better-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./_components/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./_components/avatar";

export default async function Home() {
  const session = await getSession();

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
              <UserAvatarWithMenu user={session.user} />
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

const UserAvatarWithMenu = async ({ user }: { user: User }) => {
  const handleSignOut = async () => {
    "use server";
    await auth.api.signOut({
      headers: await headers(),
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-32">
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={handleSignOut}
            variant="destructive"
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
