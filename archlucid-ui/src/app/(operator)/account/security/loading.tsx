import { Skeleton } from "@/components/ui/skeleton";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";

export default function AccountSecurityLoading() {
  return (
    <OperatorPageContainer>
      <div className="space-y-4" data-testid="account-security-page-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <div className="space-y-3 pt-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </OperatorPageContainer>
  );
}
