import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { NewRunWizardClient } from "./NewRunWizardClient";

export const metadata: Metadata = {
  title: "New run",
};

function NewRunWizardFallback() {
  return <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading wizard…</p>;
}

export default function NewRunPage() {
  return (
    <main>
      <h2>New run</h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Guided end-to-end wizard — from system description to pipeline tracking.
      </p>
      <p className="mt-2 text-sm">
        <Link href="/runs" className="text-teal-700 underline">
          Runs list
        </Link>
        {" · "}
        <Link href="/" className="text-teal-700 underline">
          Home
        </Link>
      </p>
      <Suspense fallback={<NewRunWizardFallback />}>
        <NewRunWizardClient />
      </Suspense>
    </main>
  );
}
