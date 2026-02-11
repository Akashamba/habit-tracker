import { useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

export function ScrollToEndX({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;

    el.scrollLeft = el.scrollWidth; // scroll to far right
  }, [children]);

  return (
    <div
      ref={divRef}
      className={twMerge("w-full overflow-x-auto whitespace-nowrap", className)}
      {...props}
    >
      {children}
    </div>
  );
}
