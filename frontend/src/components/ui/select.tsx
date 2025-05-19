"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

// Simple select component that doesn't rely on @radix-ui/react-select
const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    onValueChange?: (value: string) => void;
  }
>(({ className, children, onChange, onValueChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e);
    onValueChange?.(e.target.value);
  };

  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
          className
        )}
        onChange={handleChange}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 opacity-50 pointer-events-none" />
    </div>
  );
});
Select.displayName = "Select";

const SelectItem = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, children, ...props }, ref) => {
  return (
    <option
      ref={ref}
      className={cn("block w-full", className)}
      {...props}
    >
      {children}
    </option>
  );
});
SelectItem.displayName = "SelectItem";

// Export only the components we need
export { Select, SelectItem };
