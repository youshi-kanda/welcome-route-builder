import { forwardRef } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";

interface FormInputPhoneProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormInputPhone = forwardRef<HTMLInputElement, FormInputPhoneProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || `phone-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-2">
        <Label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </Label>
        <Input
          ref={ref}
          id={inputId}
          type="tel"
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            "text-base transition-base",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs font-medium text-destructive"
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

FormInputPhone.displayName = "FormInputPhone";
