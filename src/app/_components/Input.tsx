import { twMerge } from "tailwind-merge";

const Input = ({ className, ...props }: React.ComponentProps<"input">) => {
  return (
    <input
      className={twMerge(
        "mt-3 w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
};

export default Input;
