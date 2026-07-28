// src/components/ui/Input.tsx
import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftAddon,
  rightAddon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`;

  return (
    <div className="flex flex-col gap-1" style={{ width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 2 }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leftAddon && (
          <span style={{
            position: 'absolute', left: 12, color: '#64748B', pointerEvents: 'none',
            display: 'flex', alignItems: 'center',
          }}>
            {leftAddon}
          </span>
        )}
        <input
          id={inputId}
          className={`input-base ${error ? 'error' : ''} ${className}`}
          style={{
            paddingLeft: leftAddon ? 38 : 14,
            paddingRight: rightAddon ? 38 : 14,
          }}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          aria-invalid={!!error}
          {...props}
        />
        {rightAddon && (
          <span style={{
            position: 'absolute', right: 12, color: '#64748B',
            display: 'flex', alignItems: 'center',
          }}>
            {rightAddon}
          </span>
        )}
      </div>
      {error && (
        <span id={`${inputId}-error`} role="alert" style={{ fontSize: 12, color: '#EF4444', marginTop: 2 }}>
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={`${inputId}-hint`} style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
          {hint}
        </span>
      )}
    </div>
  );
};
