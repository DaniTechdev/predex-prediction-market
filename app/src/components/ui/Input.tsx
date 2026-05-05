import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  leading?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leading, suffix, ...rest },
  ref,
) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[10px] border border-border-strong bg-background-overlay px-3 h-11 transition-colors focus-within:border-accent",
        className,
      )}
    >
      {leading ? <span className="text-foreground-muted text-sm">{leading}</span> : null}
      <input
        ref={ref}
        className="flex-1 bg-transparent outline-none text-foreground text-sm placeholder:text-foreground-faint min-w-0"
        {...rest}
      />
      {suffix ? <span className="text-foreground-muted text-sm shrink-0">{suffix}</span> : null}
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-[10px] border border-border-strong bg-background-overlay px-3 py-2.5 text-foreground text-sm placeholder:text-foreground-faint outline-none transition-colors focus:border-accent resize-y min-h-[100px]",
        className,
      )}
      {...rest}
    />
  );
});

export const Label = ({
  children,
  className,
  htmlFor,
}: {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) => (
  <label
    htmlFor={htmlFor}
    className={cn("block text-xs font-medium text-foreground-muted mb-1.5 uppercase tracking-wide", className)}
  >
    {children}
  </label>
);
