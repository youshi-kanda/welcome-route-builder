import { forwardRef } from "react";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

interface ConsentCheckboxProps {
  label: string;
  error?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
}

export const ConsentCheckbox = forwardRef<HTMLButtonElement, ConsentCheckboxProps>(
  ({ label, error, checked, onCheckedChange, id }, ref) => {
    const checkboxId = id || `consent-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <Checkbox
            ref={ref}
            id={checkboxId}
            checked={checked}
            onCheckedChange={onCheckedChange}
            aria-invalid={!!error}
            aria-describedby={error ? `${checkboxId}-error` : undefined}
            className="mt-0.5"
          />
          <Label
            htmlFor={checkboxId}
            className="cursor-pointer text-sm leading-relaxed"
          >
            {label}
          </Label>
        </div>
        {error && (
          <p
            id={`${checkboxId}-error`}
            className="ml-7 text-xs font-medium text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

ConsentCheckbox.displayName = "ConsentCheckbox";
