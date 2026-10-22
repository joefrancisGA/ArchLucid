import AuthorityThemePilotRouteLayout from "@/lib/next/authority-theme-pilot-route-layout";
import { OperatorClientDrivenRouteLayout } from "@/lib/next/operator-client-driven-route-layout";

export default function OperatorSecurityTrustLayout(props: { children: React.ReactNode }) {
  return (
    <AuthorityThemePilotRouteLayout>
      <OperatorClientDrivenRouteLayout>{props.children}</OperatorClientDrivenRouteLayout>
    </AuthorityThemePilotRouteLayout>
  );
}
