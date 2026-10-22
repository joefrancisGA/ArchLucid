import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";

/**
 * Route-level Suspense boundary so navigating into review start commits the URL immediately and
 * shows the wizard shape, instead of holding the previous page until this route finishes loading.
 */
export default function NewRunLoading() {
  return (
    <div>
      <NewRunWizardSkeleton />
    </div>
  );
}
