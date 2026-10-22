import { cn } from "@/lib/utils";
import * as React from "react";

export type CheckedState = boolean | "indeterminate";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "checked" | "onChange" | "type"> {
  checked?: boolean;
  onCheckedChange?: (checked: CheckedState) => void;
}

/**
 * Styled checkbox using a native <input type="checkbox">.
 * Exposes the same `checked` / `onCheckedChange` API as the shadcn/radix Checkbox
 * so components that import from "@/components/ui/checkbox" work without the
 * @radix-ui/react-checkbox peer dependency.
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
      onCheckedChange?.(event.target.checked);
    };

    return (
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          "h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-neutral-300 accent-neutral-900",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-neutral-600 dark:accent-neutral-100",
          className,
        )}
        {...props}
      />
    );
  },
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
