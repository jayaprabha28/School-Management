import { useForm, type FieldValues } from "react-hook-form";
import type { FieldDef } from "../lib/types";
import { Input, Select, Textarea } from "./ui";

interface Props {
  fields: FieldDef[];
  defaultValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
  formId?: string;
}

function defaultFor(field: FieldDef, value: unknown) {
  if (value !== undefined && value !== null) return value;
  if (field.type === "checkbox") return false;
  return "";
}

export function DynamicForm({ fields, defaultValues = {}, onSubmit, formId = "dynamic-form" }: Props) {
  const defaults = Object.fromEntries(fields.map((f) => [f.name, defaultFor(f, defaultValues[f.name])])) as FieldValues;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({ defaultValues: defaults });

  const numberRegister = (name: string, required: boolean) =>
    register(name, {
      required: required ? "Required" : false,
      setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    });

  return (
    <form id={formId} onSubmit={handleSubmit((values) => onSubmit(values))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const required = Boolean(field.required) && field.type !== "checkbox";
        const error = errors[field.name]?.message as string | undefined;
        const wide = field.type === "textarea" || field.type === "text" && field.name === "address";
        return (
          <div key={field.name} className={wide ? "sm:col-span-2" : ""}>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              {field.label}
              {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
            </label>
            {field.type === "textarea" ? (
              <Textarea {...register(field.name, { required: required ? "Required" : false })} placeholder={field.label} />
            ) : field.type === "select" ? (
              <Select {...register(field.name, { required: required ? "Required" : false })} defaultValue={String(defaults[field.name] ?? "")}>
                <option value="">Select {field.label}</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            ) : field.type === "checkbox" ? (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600" {...register(field.name)} />
                {field.label}
              </label>
            ) : field.type === "number" || field.type === "currency" ? (
              <Input type="number" step="any" {...numberRegister(field.name, required)} placeholder={field.label} />
            ) : (
              <Input
                type={field.type === "date" ? "date" : field.type === "time" ? "time" : field.type === "email" ? "email" : "text"}
                {...register(field.name, { required: required ? "Required" : false })}
                placeholder={field.label}
              />
            )}
            {error ? <p className="mt-1 text-xs text-rose-600">{field.label} is required</p> : null}
          </div>
        );
      })}
    </form>
  );
}
