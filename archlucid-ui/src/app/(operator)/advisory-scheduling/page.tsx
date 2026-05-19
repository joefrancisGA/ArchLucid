import { AdvisorySchedulesContent } from "@/components/advisory/AdvisorySchedulesContent";

/**
 * Advisory scan schedules (also available on `/advisory?tab=schedules`).
 * Create via `POST /v1/advisory-scheduling/schedules`.
 */
export default function AdvisorySchedulingPage() {
  return <AdvisorySchedulesContent />;
}
