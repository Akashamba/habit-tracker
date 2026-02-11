"use client";

import React from "react";
import { CheckCircle2, Flame, Shield, Sparkles } from "lucide-react";

export default function SignedOutPage() {
  return (
    <div className="mx-auto min-h-screen max-w-sm text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 pb-10">
        {/* Hero */}
        <main className="flex flex-col items-center gap-8 text-center">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium text-white/60">
              Simple habit tracking, no fluff.
            </p>
            <h2 className="text-5xl font-extrabold tracking-tight">
              Track your habits.
              <span className="block text-white/70">Stay consistent.</span>
            </h2>
            <p className="mt-4 text-lg text-white/55">
              Sign in with Google to track your streaks, stats, and daily
              check-ins.
            </p>
          </div>

          {/* CTA */}
          <div className="flex w-full max-w-md flex-col gap-3">
            {/* Google button */}
            <button
              type="button"
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3 text-base font-semibold text-[#111] shadow-lg shadow-black/30 transition hover:-translate-y-[1px] hover:shadow-xl active:translate-y-0"
              onClick={() => {
                // TODO: wire to your Google SSO handler
                // signIn("google")
                alert("Sign in with Google");
              }}
            >
              Continue with Google
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-white/40">
              <Shield className="h-4 w-4" />
              <span>No passwords. No spam. Just Google SSO.</span>
            </div>
          </div>

          {/* Feature chips */}
          <section id="features" className="mt-6 w-full max-w-md">
            <div className="grid gap-3">
              <FeatureCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Daily check-ins"
                desc="Tap once. Keep the chain alive."
              />
              <FeatureCard
                icon={<Flame className="h-5 w-5" />}
                title="Streaks"
                desc="Built-in streak counter per habit."
              />
              <FeatureCard
                icon={<Sparkles className="h-5 w-5" />}
                title="Stats"
                desc="See progress without overthinking."
              />
            </div>
          </section>

          {/* Footer */}
          <footer
            id="privacy"
            className="mt-6 flex flex-col items-center gap-2 text-xs text-white/35"
          >
            <div className="flex items-center gap-2">
              <a href="/privacy" className="hover:text-white/60">
                Privacy Policy
              </a>
              <span>•</span>
              <a href="/terms" className="hover:text-white/60">
                Terms of Service
              </a>
            </div>
            <p className="text-center">
              Your data is private. You can delete it anytime.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20">
      <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-white/10 p-3 text-white/80">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-white/55">{desc}</p>
    </div>
  );
}
