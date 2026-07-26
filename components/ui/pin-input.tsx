"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  id?: string;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  className?: string;
  mask?: boolean;
}

export const PinInput = React.forwardRef<HTMLInputElement, PinInputProps>(
  (
    {
      id,
      name,
      value = "",
      onChange,
      disabled = false,
      error = false,
      autoFocus = false,
      className,
      mask = true,
    },
    ref
  ) => {
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const digits = React.useMemo(() => {
      const chars = (value || "").split("").slice(0, 4);
      while (chars.length < 4) {
        chars.push("");
      }
      return chars;
    }, [value]);

    const handleInputChange = (index: number, val: string) => {
      // Extract numeric digit
      const digit = val.replace(/\D/g, "").slice(-1);
      const newDigits = [...digits];
      newDigits[index] = digit;
      const newValue = newDigits.join("");

      if (onChange) {
        onChange(newValue);
      }

      // Move focus to next input if digit entered
      if (digit && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (!digits[index] && index > 0) {
          // Focus previous input on backspace if current box is empty
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
      if (pasted && onChange) {
        onChange(pasted);
        const focusIndex = Math.min(pasted.length, 3);
        inputRefs.current[focusIndex]?.focus();
      }
    };

    return (
      <div className={cn("flex items-center justify-center gap-3", className)}>
        {/* Hidden input for FormData / Form compatibility */}
        <input
          type="hidden"
          id={id}
          name={name}
          value={value}
          ref={ref}
        />
        {Array.from({ length: 4 }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type={mask ? "password" : "text"}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[index]}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={cn(
              "h-12 w-12 text-center text-xl font-bold tracking-widest rounded-xl border bg-background transition-all duration-200 outline-none shadow-sm",
              "focus:border-primary focus:ring-2 focus:ring-primary/20",
              error
                ? "border-destructive text-destructive focus:border-destructive focus:ring-destructive/20"
                : "border-input",
              disabled && "opacity-50 cursor-not-allowed bg-muted"
            )}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
    );
  }
);

PinInput.displayName = "PinInput";
