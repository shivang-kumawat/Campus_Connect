import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react';

const controlBase =
  'w-full rounded-xl border bg-white px-3.5 text-sm text-navy-900 placeholder:text-navy-400 transition duration-200 focus:outline-none focus:ring-4 disabled:bg-navy-50';
const controlState = (error?: string) =>
  error
    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
    : 'border-navy-200 hover:border-navy-300 focus:border-sky-500 focus:ring-sky-100';

interface FieldWrapperProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function FieldWrapper({ label, id, error, hint, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-navy-800">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-navy-500">{hint}</p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, id, className = '', ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldWrapper label={label} id={fieldId} error={error} hint={hint}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={`${controlBase} h-11 ${controlState(error)} ${className}`}
        {...rest}
      />
    </FieldWrapper>
  );
});

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  options: readonly (string | SelectOption)[];
  placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, error, hint, id, options, placeholder, className = '', ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldWrapper label={label} id={fieldId} error={error} hint={hint}>
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={`${controlBase} h-11 ${controlState(error)} ${className}`}
        {...rest}
      >
        <option value="">{placeholder ?? 'Select an option'}</option>
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value;
          const text = typeof option === 'string' ? option : option.label;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
    </FieldWrapper>
  );
});

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, error, hint, id, className = '', ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldWrapper label={label} id={fieldId} error={error} hint={hint}>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={`${controlBase} min-h-[96px] py-3 ${controlState(error)} ${className}`}
        {...rest}
      />
    </FieldWrapper>
  );
});
