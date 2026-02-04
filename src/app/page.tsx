import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await getSession();

  if (session) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <div className="bg-linear-to-b from-[#2e026d] to-[#15162c]">
        <main className="m-auto flex min-h-screen max-w-sm flex-col items-center justify-center text-white">
          Hello
        </main>
      </div>
    </HydrateClient>
  );
}
