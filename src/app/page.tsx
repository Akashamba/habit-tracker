import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient } from "~/trpc/server";
import HabitsContainer from "./features/HabitsContainer";
import QuickActionMenu from "./_components/QuickActionsMenu";
import { Button } from "./_components/Button";
import type { User } from "better-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./_components/DropdownMenu";
import { Avatar, AvatarFallback, AvatarImage } from "./_components/Avatar";
import { Toaster } from "sonner";
import SignedOutPage from "./features/SignedOutPage";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

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
        <nav className="flex h-30 flex-col">
          <div className="h-22.5 w-full bg-linear-to-b from-[#121844] to-[#020416] text-white">
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

              {session?.user && <QuickActionMenu />}
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
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem className="flex items-center gap-2 py-2" disabled>
          <div className="w-full">
            <span className="flex items-center truncate text-sm text-gray-600 group-hover:text-gray-600">
              View Profile <ChevronRight />
            </span>
            <div className="truncate">{user.email}</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
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
