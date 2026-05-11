import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level shell while configuration summary is loading.
 */
export default function AdminConfigurationLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6" aria-busy>
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      {["a", "b"].map((k) => {
        return (
          <Card key={k}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
