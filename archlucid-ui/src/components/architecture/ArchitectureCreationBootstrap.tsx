"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { initializeArchitectureCreation } from "@/lib/architecture-creation-init";
import { architectureDraftPath } from "@/lib/architecture-routes";
import { CREATE_ARCHITECTURE_STARTING_LABEL } from "@/lib/review-start-progress-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Idempotent draft bootstrap — creates or restores a draft, then opens `/architectures/{id}`. */
export function ArchitectureCreationBootstrap(): React.JSX.Element {
  const router = useRouter();
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    void initializeArchitectureCreation()
      .then((result) => {
        if (result.draftId === null) {
          setError("Could not start a new architecture draft. Try again.");

          return;
        }

        router.replace(architectureDraftPath(result.draftId));
      })
      .catch(() => {
        setError("Could not start a new architecture draft. Try again.");
      });
  }, [router]);

  if (error !== null) {
    return (
      <div className="space-y-3" data-testid="architecture-creation-bootstrap-error">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="alert">
          {error}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            startedRef.current = false;
            setError(null);
            void initializeArchitectureCreation().then((result) => {
              if (result.draftId !== null) {
                router.replace(architectureDraftPath(result.draftId));
              } else {
                setError("Could not start a new architecture draft. Try again.");
              }
            });
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-creation-bootstrap-loading">
      {CREATE_ARCHITECTURE_STARTING_LABEL}
    </p>
  );
}
