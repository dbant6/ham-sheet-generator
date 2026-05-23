import { useId } from 'react'

/**
 * Field — accessible, senior-friendly form primitives.
 * All variants share label + helper text + error rendering.
 */

function ErrorRow({ id, error }) {
  if (!error) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-base text-alert-700 font-medium">
      {error}
    </p>
  )
}

function LabelBlock({ htmlFor, label, help, required }) {
  return (
    <>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required && <span aria-hidden="true" className="text-alert-600 ml-1">*</span>}
      </label>
      {help && <span className="field-help">{help}</span>}
    </>
  )
}

export function TextField({ label, help, name, value, onChange, error, required, type = 'text', placeholder, autoComplete }) {
  const id = useId()
  const errId = `${id}-err`
  return (
    <div>
      <LabelBlock htmlFor={id} label={label} help={help} required={required} />
      <input
        id={id}
        name={name}
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="field-input"
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? errId : undefined}
      />
      <ErrorRow id={errId} error={error} />
    </div>
  )
}

export function TextAreaField({ label, help, name, value, onChange, error, required, rows = 5, placeholder }) {
  const id = useId()
  const errId = `${id}-err`
  return (
    <div>
      <LabelBlock htmlFor={id} label={label} help={help} required={required} />
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="field-textarea"
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? errId : undefined}
      />
      <ErrorRow id={errId} error={error} />
    </div>
  )
}

export function SelectField({ label, help, name, value, onChange, options, error, required, placeholder = 'Choose one…' }) {
  const id = useId()
  const errId = `${id}-err`
  return (
    <div>
      <LabelBlock htmlFor={id} label={label} help={help} required={required} />
      <select
        id={id}
        name={name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="field-select"
        aria-invalid={!!error}
        aria-describedby={error ? errId : undefined}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
      <ErrorRow id={errId} error={error} />
    </div>
  )
}

export function RadioGroupField({ label, help, name, value, onChange, options, error, required }) {
  const id = useId()
  const errId = `${id}-err`
  return (
    <fieldset aria-describedby={error ? errId : undefined}>
      <legend className="field-label">
        {label}
        {required && <span aria-hidden="true" className="text-alert-600 ml-1">*</span>}
      </legend>
      {help && <span className="field-help">{help}</span>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
        {options.map((o) => {
          const optVal = o.value ?? o
          const optLabel = o.label ?? o
          const selected = value === optVal
          return (
            <label
              key={optVal}
              className={[
                'cursor-pointer rounded-xl border px-4 py-3 flex items-center gap-3 transition-colors',
                selected
                  ? 'border-navy-700 bg-navy-50 ring-2 ring-navy-700/15'
                  : 'border-paper-edge bg-white hover:border-navy-200',
              ].join(' ')}
            >
              <input
                type="radio"
                name={name}
                value={optVal}
                checked={selected}
                onChange={() => onChange(optVal)}
                className="!w-5 !h-5"
              />
              <span className="text-lg font-medium">{optLabel}</span>
            </label>
          )
        })}
      </div>
      <ErrorRow id={errId} error={error} />
    </fieldset>
  )
}

export function CheckboxField({ label, help, name, value, onChange, error, required, children }) {
  const id = useId()
  const errId = `${id}-err`
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-start gap-4 cursor-pointer rounded-xl border border-paper-edge bg-white p-5 hover:border-navy-200"
      >
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="!w-6 !h-6 mt-0.5"
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
        />
        <span className="text-lg leading-snug">
          <span className="font-semibold">
            {label}
            {required && <span aria-hidden="true" className="text-alert-600 ml-1">*</span>}
          </span>
          {help && <span className="block text-base text-ink-muted mt-1">{help}</span>}
          {children}
        </span>
      </label>
      <ErrorRow id={errId} error={error} />
    </div>
  )
}
