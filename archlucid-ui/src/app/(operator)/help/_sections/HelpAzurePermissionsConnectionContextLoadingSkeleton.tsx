import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AZURE_PERMISSIONS_HELP_CONNECTION_CONTEXT_LOADING_SKELETON_TEST_ID } from "@/lib/azure-permissions-help-evidence-copy";
import { OPERATOR_CARD } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const CONNECTION_CONTEXT_VALUE_ROW_COUNT = 5;

/** Shell-standard placeholder while Azure connection query params hydrate (TB-1630). */
export function HelpAzurePermissionsConnectionContextLoadingSkeleton(): React.ReactElement {
  return (
    <Card>
      <CardContent className={cn(OPERATOR_CARD.content, "pt-6")}>
        <div
          aria-busy="true"
          aria-label="Loading connection values"
          className="space-y-4"
          data-testid={AZURE_PERMISSIONS_HELP_CONNECTION_CONTEXT_LOADING_SKELETON_TEST_ID}
          role="status"
        >
          {Array.from({ length: CONNECTION_CONTEXT_VALUE_ROW_COUNT }, (_, index) => (
            <div key={index} className="space-y-1">
              <Skeleton className="h-4 w-44 max-w-full" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      </CardContent>
    </Card>
  );
}
