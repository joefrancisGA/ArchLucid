import { AlertRoutingContent } from "@/components/alerts/AlertRoutingContent";

/**
 * Dedicated alert routing page (also available on `/alerts?tab=routing`).
 * Create via `POST /v1/alert-routing-subscriptions`.
 */
export default function AlertRoutingPage() {
  return <AlertRoutingContent />;
}
