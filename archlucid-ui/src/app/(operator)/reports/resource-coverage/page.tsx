import type { Metadata } from "next";

import { ResourceCoveragePageClient } from "./_sections/ResourceCoveragePageClient";

export const metadata: Metadata = {
  title: "Resource coverage",
};

export default function ResourceCoveragePage() {
  return <ResourceCoveragePageClient />;
}
