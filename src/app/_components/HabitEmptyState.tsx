import { useState, useEffect } from "react";

export function HabitsEmptyState() {
  const [visible, setVisible] = useState(false);
  const [dotPhase, setDotPhase] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotPhase((p) => (p + 1) % 60);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const rows = 7;
  const cols = 18;

  return (
    <div
      className={`relative mx-auto flex min-h-125 max-w-md flex-col items-center justify-center overflow-hidden px-7 pt-10 pb-9 transition-all duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      {/* Headline */}
      <h2 className="mb-[10px] text-center text-[22px] font-bold tracking-[-0.3px] text-white">
        Nothing to track yet
      </h2>

      {/* Subtext */}
      <p className="mb-7 max-w-[240px] text-center text-sm leading-6 text-white/40">
        Build something worth repeating. Your first habit is one tap away.
      </p>

      {/* CTA */}
      {/* <button
        onClick={onCreateHabit}
        className="rounded-full bg-[linear-gradient(135deg,#2ecc64,#27ae50)] px-8 py-[13px] text-[15px] font-bold text-white shadow-[0_4px_24px_rgba(46,204,100,0.3)] transition-all duration-150 ease-in-out hover:scale-[1.04] hover:shadow-[0_6px_30px_rgba(46,204,100,0.45)]"
      >
        + Create your first habit
      </button> */}

      {/* Streak indicator */}
      <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-white/20">
        <span>🔥</span>
        <span>0 day streak — change that today</span>
      </div>
    </div>
  );
}
