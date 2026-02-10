import { twMerge } from "tailwind-merge";

const Button = ({
  onClick,
  children,
  className,
  disabled,
}: {
  onClick?: () => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) => {
  return (
    <button
      className={twMerge(
        "cursor-pointer rounded-3xl bg-[#3a3d58] px-4 py-1 text-[10pt] font-light whitespace-nowrap text-[#c8c5c5] transition-colors duration-150 ease-in-out active:scale-95 active:bg-[#4a4d68]",
        className,
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
