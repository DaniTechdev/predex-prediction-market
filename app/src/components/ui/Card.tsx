import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-card)] border border-border bg-background-elevated/70 backdrop-blur-sm shadow-[0_1px_0_rgb(255_255_255_/_0.04)_inset]",
          className,
        )}
        {...rest}
      />
    );
  },
);

export const CardHeader = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-5 sm:p-6 border-b border-border", className)} {...rest} />
);

export const CardBody = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-5 sm:p-6", className)} {...rest} />
);

export const CardFooter = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("p-5 sm:p-6 border-t border-border flex items-center gap-3", className)}
    {...rest}
  />
);
