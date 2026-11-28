"use client";

import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { InteractiveChip } from "@/components/ui/interactive-chip";
import {
  SECURENOW_ACCELERATOR_CATALOG_FILTER_LABELS,
  type SecureNowAcceleratorCatalogTag,
} from "@/lib/product-line/securenow-accelerator-catalog-taxonomy";

const TAGS: readonly SecureNowAcceleratorCatalogTag[] = ["all", "collection", "walks", "procurement", "templates"];

type SecureNowAcceleratorCatalogFilterChipsProps = {
  readonly activeTag: SecureNowAcceleratorCatalogTag;
  readonly onTagChange: (tag: SecureNowAcceleratorCatalogTag) => void;
};

export function SecureNowAcceleratorCatalogFilterChips(props: SecureNowAcceleratorCatalogFilterChipsProps): React.JSX.Element {
  return (
    <FilterChipGroup aria-label="Filter accelerator catalog" data-testid="securenow-accelerator-catalog-filters">
      {TAGS.map((tag) => (
        <InteractiveChip
          key={tag}
          aria-pressed={props.activeTag === tag}
          onClick={() => {
            props.onTagChange(tag);
          }}
          data-testid={`securenow-accelerator-catalog-filter-${tag}`}
        >
          {SECURENOW_ACCELERATOR_CATALOG_FILTER_LABELS[tag]}
        </InteractiveChip>
      ))}
    </FilterChipGroup>
  );
}
