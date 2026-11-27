"use client";

import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
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
    <FilterChipGroup ariaLabel="Filter accelerator catalog" data-testid="securenow-accelerator-catalog-filters">
      {TAGS.map((tag) => (
        <FilterChip
          key={tag}
          pressed={props.activeTag === tag}
          onPressedChange={() => {
            props.onTagChange(tag);
          }}
          data-testid={`securenow-accelerator-catalog-filter-${tag}`}
        >
          {SECURENOW_ACCELERATOR_CATALOG_FILTER_LABELS[tag]}
        </FilterChip>
      ))}
    </FilterChipGroup>
  );
}
