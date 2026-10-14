import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Check, X } from "lucide-react";
import { api } from "../lib/api";
import { useNavigation } from "../lib/useNavigation";
import type { FieldDef, ListResponse } from "../lib/types";
import { Card, PageHeader, Select, Spinner } from "../components/ui";

interface Row {
  id: string;
  data: Record<string, unknown>;
}

const FALLBACK_SUBJECTS = ["Tamil", "English", "Mathematics", "Science", "Social Science", "Computer Science"];

const PALETTE = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];

function colorFor(subject: string, subjects: string[]) {
  const idx = subjects.indexOf(subject);
  return PALETTE[(idx < 0 ? 0 : idx) % PALETTE.length];
}

export default function TimetablePage() {
  const { module: moduleCode = "", submenu = "" } = useParams();
  const queryClient = useQueryClient();
  const { data: nav } = useNavigation();

  const navModule = nav?.modules.find((m) => m.shortCode === moduleCode);
  const section = navModule?.sections.find((s) => s.shortCode === submenu);
  const fields: FieldDef[] = section?.fields ?? [];
  const optionsOf = (name: string) => fields.find((f) => f.name === name)?.options ?? [];

  const classOptions = optionsOf("class");
  const sectionOptions = optionsOf("section");
  const dayOptions = optionsOf("day").length ? optionsOf("day") : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const [cls, setCls] = useState("");
  const [sec, setSec] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const activeClass = cls || classOptions[0] || "";
  const activeSec = sec || sectionOptions[0] || "";

  const canEdit = Boolean(nav?.isAdmin || navModule?.isStudentPanel || nav?.permissions[moduleCode]?.includes("edit"));

  const listQuery = useQuery({
    queryKey: ["entities", submenu, activeClass, activeSec],
    queryFn: async () =>
      (
        await api.get<ListResponse>(`/entities/${submenu}`, {
          params: { class: activeClass, section: activeSec, limit: 100 },
        })
      ).data,
    enabled: Boolean(section) && Boolean(activeClass) && Boolean(activeSec),
  });

  const subjectsQuery = useQuery({
    queryKey: ["entities", "subjects", activeClass],
    queryFn: async () => (await api.get<ListResponse>("/entities/subjects", { params: { class: activeClass, limit: 100 } })).data,
    enabled: Boolean(section) && Boolean(activeClass),
  });

  const rows: Row[] = listQuery.data?.items ?? [];

  const subjectOptions = useMemo(() => {
    const fromSubjects = (subjectsQuery.data?.items ?? []).map((i) => ({
      name: String(i.data.subject_name ?? ""),
      teacher: String(i.data.teacher ?? ""),
    }));
    if (fromSubjects.length) return fromSubjects;
    return FALLBACK_SUBJECTS.map((name) => ({ name, teacher: "" }));
  }, [subjectsQuery.data]);

  const subjectNames = subjectOptions.map((s) => s.name);

  const periods = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      const start = String(r.data.start_time ?? "");
      const end = String(r.data.end_time ?? "");
      if (start && !map.has(start)) map.set(start, end);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([start, end]) => ({ start, end }));
  }, [rows]);

  const findCell = (day: string, start: string) => rows.find((r) => r.data.day === day && String(r.data.start_time) === start);

  const saveMutation = useMutation({
    mutationFn: async (input: { day: string; start: string; end: string; subjectName: string; teacherName: string }) => {
      const existing = findCell(input.day, input.start);
      if (existing) {
        return (
          await api.patch(`/entities/${submenu}/${existing.id}`, {
            subject: input.subjectName,
            teacher: input.teacherName,
          })
        ).data;
      }
      return (
        await api.post(`/entities/${submenu}`, {
          class: activeClass,
          section: activeSec,
          day: input.day,
          subject: input.subjectName,
          teacher: input.teacherName,
          start_time: input.start,
          end_time: input.end,
          room: `${activeClass.replace("Class ", "")}${activeSec}-${input.start.replace(":", "")}`,
        })
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities", submenu] });
      setEditing(null);
    },
  });

  if (nav && !section) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">Timetable not available</p>
        <p className="mt-1 text-xs text-slate-500">You may not have permission to view this topic, or it is disabled.</p>
      </Card>
    );
  }

  const busy = listQuery.isLoading || subjectsQuery.isLoading;

  return (
    <div>
      <PageHeader
        title="Class Timetable"
        subtitle={navModule?.label ?? "Academics"}
        actions={
          <>
            <Select aria-label="Class" className="w-auto" value={activeClass} onChange={(e) => { setCls(e.target.value); setEditing(null); }}>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select aria-label="Section" className="w-auto" value={activeSec} onChange={(e) => { setSec(e.target.value); setEditing(null); }}>
              {sectionOptions.map((s) => (
                <option key={s} value={s}>
                  Section {s}
                </option>
              ))}
            </Select>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span className="font-medium text-slate-600">
            {activeClass} · Section {activeSec}
          </span>
          <span>&middot;</span>
          <span>{rows.length} periods</span>
          {canEdit ? <span className="ml-auto text-slate-400">Click any cell to change the subject</span> : null}
        </div>

        {busy ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-28 border-b border-r border-slate-100 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600">
                    Period
                  </th>
                  {dayOptions.map((day) => (
                    <th key={day} className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.length === 0 ? (
                  <tr>
                    <td colSpan={dayOptions.length + 1} className="px-4 py-10 text-center text-sm text-slate-500">
                      No periods yet for this class/section.
                    </td>
                  </tr>
                ) : (
                  periods.map((p) => (
                    <tr key={p.start} className="align-top">
                      <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-3 py-2 text-xs text-slate-500">
                        <div className="font-medium text-slate-700">
                          {p.start}
                          <br />
                          {p.end}
                        </div>
                      </td>
                      {dayOptions.map((day) => {
                        const current = findCell(day, p.start);
                        const key = `${day}|${p.start}`;
                        const isEditing = editing === key;
                        const subject = current ? String(current.data.subject ?? "") : "";
                        return (
                          <td key={day} className="border-b border-slate-100 p-1">
                            {isEditing && canEdit ? (
                              <div className="flex items-center gap-1">
                                <Select
                                  autoFocus
                                  className="py-1 text-xs"
                                  value={subject}
                                  onChange={(e) => {
                                    const name = e.target.value;
                                    if (!name) return;
                                    const opt = subjectOptions.find((o) => o.name === name);
                                    saveMutation.mutate({
                                      day,
                                      start: p.start,
                                      end: p.end,
                                      subjectName: name,
                                      teacherName: opt?.teacher ?? "",
                                    });
                                  }}
                                >
                                  <option value="">— select subject —</option>
                                  {subjectOptions.map((o) => (
                                    <option key={o.name} value={o.name}>
                                      {o.name}
                                    </option>
                                  ))}
                                </Select>
                                <button
                                  onClick={() => setEditing(null)}
                                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                  aria-label="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={!canEdit}
                                onClick={() => canEdit && setEditing(key)}
                                className={
                                  "flex min-h-14 w-full flex-col items-start justify-center rounded-lg px-2 py-1.5 text-left transition " +
                                  (subject ? colorFor(subject, subjectNames) : "text-slate-300 hover:bg-slate-50 hover:text-slate-400") +
                                  (canEdit ? " cursor-pointer" : " cursor-default")
                                }
                              >
                                {subject ? (
                                  <>
                                    <span className="text-xs font-semibold">{subject}</span>
                                    {current?.data.teacher ? (
                                      <span className="text-[11px] opacity-80">{String(current.data.teacher)}</span>
                                    ) : null}
                                  </>
                                ) : (
                                  <span className="text-lg leading-none">+</span>
                                )}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {saveMutation.isError ? (
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-rose-600">Could not save. Please try again.</p>
        ) : null}

        {canEdit && periods.length ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            Changes save instantly. Teacher is filled automatically from the subject.
            {saveMutation.isPending ? <span className="text-indigo-600">Saving...</span> : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
