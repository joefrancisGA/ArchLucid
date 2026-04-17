import { GenericPageSkeleton } from "@/components/skeletons/GenericPageSkeleton";

/** Loading placeholder for manifest summary and artifact list. */
export default function ManifestDetailLoading() {
  return (
    <main className="mx-auto max-w-4xl px-1 py-4 sm:px-0">
      <GenericPageSkeleton />
    </main>
  );
}
