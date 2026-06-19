import { GenericPageSkeleton } from "@/components/skeletons/GenericPageSkeleton";

/** Loading placeholder for coordinator provenance (graph + timeline). */
export default function RunProvenanceLoading() {
  return (
    <div className="w-full max-w-[1200px] px-1 py-4 sm:px-0">
      <GenericPageSkeleton />
    </div>
  );
}
