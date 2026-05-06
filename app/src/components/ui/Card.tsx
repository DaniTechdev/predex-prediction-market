import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn("diamond overflow-hidden", className)}
        {...rest}
      />
    );
  },
);

export const CardHeader = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("p-5 sm:p-6 border-b border-border/60 relative", className)}
    {...rest}
  />
);

export const CardBody = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-5 sm:p-6 relative", className)} {...rest} />
);

export const CardFooter = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("p-5 sm:p-6 border-t border-border/60 flex items-center gap-3 relative", className)}
    {...rest}
  />
);
