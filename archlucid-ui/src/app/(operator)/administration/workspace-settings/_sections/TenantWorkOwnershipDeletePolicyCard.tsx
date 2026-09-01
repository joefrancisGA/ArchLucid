import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useWorkOwnershipDeletePolicyQuery } from "@/hooks/use-work-ownership-delete-policy-query";
import {
  type TenantWorkOwnershipDeletePolicyResponse,
  updateTenantWorkOwnershipDeletePolicy,
} from "@/lib/tenant-work-ownership-delete-policy-client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function PolicyToggle(props: {
  readonly label: string;
  readonly description: string;
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
}): React.JSX.Element {
  return (
    <label className="flex items-start justify-between gap-4 rounded-md border border-border p-4">
      <span className="space-y-1">
        <span className="block font-medium text-al-text-primary">{props.label}</span>
        <span className={`block ${OPERATOR_TYPOGRAPHY.helper} text-al-text-secondary`}>{props.description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 size-4"
        checked={props.checked}
        disabled={props.disabled}
        data-testid={`work-ownership-delete-toggle-${props.label}`}
        onChange={(event) => props.onCheckedChange(event.target.checked)}
      />
    </label>
  );
}

export function TenantWorkOwnershipDeletePolicyCard(): React.JSX.Element {
  const queryClient = useQueryClient();
  const policyQuery = useWorkOwnershipDeletePolicyQuery();
  const [draft, setDraft] = useState<TenantWorkOwnershipDeletePolicyResponse | null>(null);

  useEffect(() => {
    if (policyQuery.data !== undefined) {
      setDraft(policyQuery.data);
    }
  }, [policyQuery.data]);

  const saveMutation = useMutation({
    mutationFn: updateTenantWorkOwnershipDeletePolicy,
    onSuccess: async (saved) => {
      setDraft(saved);
      await queryClient.invalidateQueries({ queryKey: ["tenant-work-ownership-delete-policy"] });
      toast.success("Work ownership delete policy saved.");
    },
    onError: () => {
      toast.error("Could not save work ownership delete policy.");
    },
  });

  if (policyQuery.isLoading || draft === null) {
    return <p className={`${OPERATOR_TYPOGRAPHY.helper} text-al-text-secondary`}>Loading work ownership delete policy…</p>;
  }

  if (policyQuery.isError || policyQuery.data === undefined) {
    return <p className={`${OPERATOR_TYPOGRAPHY.helper} text-al-text-secondary`}>Work ownership delete policy is unavailable.</p>;
  }

  const savedPolicy = policyQuery.data;
  const dirty = draft.allowCreatorDeleteOwnedWork !== savedPolicy.allowCreatorDeleteOwnedWork;

  return (
    <div className="space-y-4" data-testid="tenant-work-ownership-delete-policy-card">
      <PolicyToggle
        label="Allow creator delete"
        description="When enabled, operators can delete or archive their own unsealed architectures and in-flight reviews. Workspace administrators can always remove work."
        checked={draft.allowCreatorDeleteOwnedWork}
        disabled={saveMutation.isPending}
        onCheckedChange={(checked) => setDraft({ allowCreatorDeleteOwnedWork: checked })}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!dirty || saveMutation.isPending}
          data-testid="tenant-work-ownership-delete-policy-save"
          onClick={() => void saveMutation.mutate(draft)}
        >
          Save policy
        </Button>
      </div>
    </div>
  );
}
