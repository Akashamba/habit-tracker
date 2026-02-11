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
import { Toaster } from "sonner";
import SignedOutPage from "./_components/SignedOutPage";
import Image from "next/image";

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
      <Toaster position="top-center" />
      <main className="min-h-screen bg-[#020416]">
        <nav className="flex flex-col">
          <div className="h-[13vh] w-full bg-linear-to-b from-[#121844] to-[#020416] text-[#fff]">
            <div className="mx-auto max-w-md">
              <div className="flex items-center justify-between p-5">
                <div className="flex items-end gap-3">
                  <div className="mb-2 size-10 rounded-4xl bg-[#76A9D6]">
                    <Image
                      src="/favicon.png"
                      alt="logo"
                      width={300}
                      height={200}
                    />
                  </div>
                  <div className="title text-[24pt] font-medium">Habits</div>
                </div>

                {session?.user ? (
                  <UserAvatarWithMenu user={session.user} />
                ) : (
                  <button
                    className="cursor-pointer items-center justify-center gap-3 rounded-2xl bg-white px-3 py-1 text-base font-semibold text-[#111]"
                    onClick={handleSignIn}
                  >
                    Sign In
                  </button>
                )}
              </div>

              {session?.user && <QuickMenu />}
            </div>
          </div>
        </nav>

        {session?.user ? <HabitsContainer /> : <SignedOutPage />}
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
