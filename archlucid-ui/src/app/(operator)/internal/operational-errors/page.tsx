import type { Metadata } from "next";

import { OperationalErrorsPageClient } from "./_sections/OperationalErrorsPageClient";

export const metadata: Metadata = {
  title: "Operational errors",
};

/** Admin-only platform error inbox for HTTP, database, and unhandled exceptions. */
export default function OperationalErrorsPage() {
  return <OperationalErrorsPageClient />;
}
