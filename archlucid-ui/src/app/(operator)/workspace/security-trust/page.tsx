import { OperatorSecurityTrustPageView } from "./_sections/OperatorSecurityTrustPageView";

/**
 * Operator trust and security home (signed-in shell). Procurement-oriented strip plus NDA-gated pen-test posture.
 * Public engagement table lives at <c>/security-trust</c> (marketing) — this route is <c>/workspace/security-trust</c> so
 * App Router does not collide with the parallel marketing page.
 */
export default function OperatorSecurityTrustPage() {
  return <OperatorSecurityTrustPageView />;
}
