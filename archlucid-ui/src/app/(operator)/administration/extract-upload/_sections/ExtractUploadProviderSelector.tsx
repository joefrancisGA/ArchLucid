"use client";

import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { cloudInventoryPlatformLabel } from "@/lib/cloud-inventory-platform";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { EXTRACT_UPLOAD_PROVIDER_SELECTOR_LABEL } from "@/lib/extract-upload-settings-page-copy";

const PROVIDER_OPTIONS: readonly CloudInventoryPlatform[] = ["azure", "aws", "gcp"];

export type ExtractUploadProviderSelectorProps = {
  readonly value: CloudInventoryPlatform;
  readonly onValueChange: (platform: CloudInventoryPlatform) => void;
};

export function ExtractUploadProviderSelector(
  props: ExtractUploadProviderSelectorProps,
): React.JSX.Element {
  return (
    <div className="space-y-1" data-testid="extract-upload-provider-selector">
      <label
        className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        htmlFor="extract-upload-provider-select"
      >
        {EXTRACT_UPLOAD_PROVIDER_SELECTOR_LABEL}
      </label>
      <Select
        value={props.value}
        onValueChange={(next) => {
          props.onValueChange(next as CloudInventoryPlatform);
        }}
      >
        <SelectTrigger id="extract-upload-provider-select" data-testid="extract-upload-provider-select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PROVIDER_OPTIONS.map((platform) => (
            <SelectItem key={platform} value={platform}>
              {cloudInventoryPlatformLabel(platform)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
