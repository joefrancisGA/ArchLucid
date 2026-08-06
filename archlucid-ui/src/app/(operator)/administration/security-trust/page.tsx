import { OperatorSecurityTrustPageView } from "./_sections/OperatorSecurityTrustPageView";

/**
 * Operator trust and security home (signed-in shell). Procurement-oriented strip plus NDA-gated pen-test posture.
 * Public engagement table lives at <c>/security-trust</c> (marketing). Canonical operator route is
 * <c>/settings/security-trust</c> (legacy <c>/workspace/security-trust</c> permanent redirect).
 */
export default function OperatorSecurityTrustPage() {
  return <OperatorSecurityTrustPageView />;
}
