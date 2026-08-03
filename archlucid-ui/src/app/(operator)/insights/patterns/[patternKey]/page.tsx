import { notFound } from "next/navigation";

import { PatternLibraryDetailClient } from "../_sections/PatternLibraryDetailClient";
import { findPatternLibraryRecord } from "@/lib/pattern-library-catalog";

type PatternDetailPageProps = {
  params: Promise<{ patternKey: string }>;
};

export default async function PatternDetailPage(props: PatternDetailPageProps): Promise<React.ReactElement> {
  const { patternKey } = await props.params;
  const record = findPatternLibraryRecord(patternKey);

  if (record === null) {
    notFound();
  }

  return <PatternLibraryDetailClient patternKey={record.patternKey} />;
}
