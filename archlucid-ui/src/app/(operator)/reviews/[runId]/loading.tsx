import { RunDetailSkeleton } from "@/components/skeletons/RunDetailSkeleton";

/** Next.js loading UI while the server run detail page fetches run, manifest, artifacts, and explanation. */
export default function RunDetailLoading() {
  return (
    <div className="w-full max-w-[1200px] px-1 py-4 sm:px-0">
      <RunDetailSkeleton />
    </div>
  );
}
