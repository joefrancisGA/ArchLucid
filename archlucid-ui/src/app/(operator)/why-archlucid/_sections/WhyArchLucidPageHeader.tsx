export function WhyArchLucidPageHeader() {
  return (
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Why ArchLucid</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        A live look behind the curtain. Every section on this page is rendered from the API of the running ArchLucid host
        against the seeded Contoso Retail Modernization demo tenant — no slides, no static screenshots. Counters accumulate
        from the moment the API process starts and reset on restart.
      </p>
    </header>
  );
}
