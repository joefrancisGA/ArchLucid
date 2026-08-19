import type { ReactNode } from "react";

/** Bordered card with a title, used to visually group a section of page content. */
export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
      <h3 className="mt-0">{title}</h3>
      {children}
    </section>
  );
}
