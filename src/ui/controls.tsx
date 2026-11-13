import { useId } from 'react';

/*
 * Briques de formulaire réutilisées par les contrôles des filtres.
 * Purement visuelles : aucune logique métier.
 */

const fieldClass =
  'min-h-11 w-full rounded-card border border-line bg-surface px-3 text-base text-ink placeholder:text-ink-muted';

export function TextField(props: {
  label: string;
  value: string;
  onChange(value: string): void;
  placeholder?: string;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
      {props.label}
      <input
        type="text"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className={fieldClass}
      />
    </label>
  );
}

/** Champ d'entier positif ; vide = null. */
export function NumberField(props: {
  label: string;
  value: number | null;
  onChange(value: number | null): void;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
      {props.label}
      <input
        type="number"
        inputMode="numeric"
        value={props.value ?? ''}
        min={props.min ?? 0}
        max={props.max}
        step={1}
        placeholder={props.placeholder}
        onChange={(event) => {
          const text = event.target.value.trim();
          if (text === '') return props.onChange(null);
          const parsed = Number(text);
          if (Number.isInteger(parsed) && parsed >= 0) props.onChange(parsed);
        }}
        className={fieldClass}
      />
    </label>
  );
}

const chipClass =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-card border border-line px-3 pressable';

/** Choix unique parmi quelques options (boutons radio). */
export function ChoiceGroup<T extends string>(props: {
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange(value: T): void;
}) {
  const name = useId();
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="mb-1 text-sm">{props.legend}</legend>
      {props.options.map((option) => (
        <label
          key={option.value}
          className={`${chipClass} has-checked:border-accent has-checked:bg-accent-soft`}
        >
          <input
            type="radio"
            name={name}
            checked={props.value === option.value}
            onChange={() => props.onChange(option.value)}
            className="accent-accent"
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}

/** Choix multiple compact (boutons à bascule), par exemple des lettres ou des décennies. */
export function ToggleGroup<T extends string>(props: {
  legend: string;
  options: readonly { value: T; label: string }[];
  selected: readonly T[];
  onToggle(value: T): void;
  compact?: boolean;
}) {
  return (
    <fieldset className="flex flex-wrap gap-1">
      <legend className="mb-1 text-sm">{props.legend}</legend>
      {props.options.map((option) => {
        const pressed = props.selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => props.onToggle(option.value)}
            className={`${chipClass} ${props.compact ? 'min-w-11 px-0' : ''} ${
              pressed ? 'border-accent bg-accent-soft font-semibold' : ''
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}

/** Deux champs côte à côte. */
export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2">{children}</div>;
}
