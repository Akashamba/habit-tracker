"use client";

import React from "react";
import { authClient } from "~/server/better-auth/client";

const Test = () => {
  const user = authClient.useSession().data?.user;

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <div>
      {!user ? (
        <button
          className="cursor-pointer border border-black p-2"
          onClick={handleSignIn}
        >
          Sign In with Google
        </button>
      ) : (
        <button
          className="cursor-pointer border border-black p-2"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      )}
    </div>
  );
};

export default Test;
