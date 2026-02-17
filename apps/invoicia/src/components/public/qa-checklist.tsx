"use client";

import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function PublicQaChecklist({
  title = "QA checklist",
  items,
  className,
}: {
  title?: string;
  items: string[];
  className?: string;
}) {
  const show = process.env.NODE_ENV !== "production";
  if (!show || items.length === 0) return null;

  return (
    <div
      className={cn(
        "mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white/80 p-4 text-sm text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-950/70 dark:text-zinc-400",
        className,
      )}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
        {title}
      </div>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-zinc-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

