"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchCloudResourceExplorerPage } from "@/lib/infra-evidence/infra-evidence-hub-api";
import type { CloudResourceSummary } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { buildTerraformWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-terraform-filter-url";
import {
  formatAzureResourceTypeForDisplay,
  formatCloudResourceDisplayName,
} from "@/lib/infra-evidence/format-azure-resource-display";
import {
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_PICKER_LABEL,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_PICKER_PLACEHOLDER,
} from "@/lib/governance/governance-infrastructure-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TerraformWorkbenchScopePickerProps = {
  readonly inputRef?: React.RefObject<HTMLInputElement | null>;
};

export function TerraformWorkbenchScopePicker(props: TerraformWorkbenchScopePickerProps): React.JSX.Element {
  const router = useRouter();
  const generatedId = useId();
  const controlId = `infra-terraform-scope-picker-${generatedId}`;
  const internalRef = useRef<HTMLInputElement | null>(null);
  const inputRef = props.inputRef ?? internalRef;
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<readonly CloudResourceSummary[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const navigateToResource = useCallback(
    (cloudResourceId: string) => {
      const trimmed = cloudResourceId.trim();

      if (trimmed.length === 0) {
        return;
      }

      router.push(buildTerraformWorkbenchHref({ cloudResourceId: trimmed }));
      setOpen(false);
    },
    [router],
  );

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setOptions([]);
      setLoading(false);

      return;
    }

    let cancelled = false;

    async function loadOptions() {
      setLoading(true);

      try {
        const page = await fetchCloudResourceExplorerPage({ namePrefix: trimmed }, 1, 8);

        if (!cancelled) {
          setOptions(page.items);
        }
      } catch {
        if (!cancelled) {
          setOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadOptions();
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const selectOption = useCallback(
    (row: CloudResourceSummary) => {
      navigateToResource(row.cloudResourceId);
      setQuery("");
    },
    [navigateToResource],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, options.length - 1));

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (open && activeIndex >= 0 && options[activeIndex] != null) {
        selectOption(options[activeIndex]);

        return;
      }

      const trimmed = query.trim();

      if (UUID_PATTERN.test(trimmed)) {
        navigateToResource(trimmed);
        setQuery("");
      }

      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="grid max-w-xl gap-2" data-testid="infra-terraform-scope-picker">
      <Label htmlFor={controlId}>{GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_PICKER_LABEL}</Label>
      <Input
        ref={inputRef}
        id={controlId}
        role="combobox"
        value={query}
        placeholder={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_PICKER_PLACEHOLDER}
        autoComplete="off"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={open && options.length > 0}
        aria-controls={open && options.length > 0 ? `${controlId}-listbox` : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 && options[activeIndex] != null
            ? `${controlId}-option-${activeIndex}`
            : undefined
        }
        onFocus={() => {
          setOpen(true);
        }}
        onClick={() => {
          setOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            if (containerRef.current?.contains(document.activeElement) !== true) {
              setOpen(false);
              setActiveIndex(-1);
            }
          }, 120);
        }}
        onKeyDown={handleKeyDown}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
      />
      {open && (loading || options.length > 0) ? (
        <ul
          id={`${controlId}-listbox`}
          role="listbox"
          className={cn(
            "m-0 max-h-60 list-none overflow-auto rounded-md border border-neutral-200 bg-white p-1 shadow-md dark:border-neutral-700 dark:bg-neutral-900",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="infra-terraform-scope-picker-listbox"
        >
          {loading ? (
            <li className="px-2 py-1.5 text-al-text-secondary">Searching resources…</li>
          ) : null}
          {!loading
            ? options.map((row, index) => {
                const displayName = formatCloudResourceDisplayName({
                  displayName: row.displayName,
                  externalResourceId: row.externalResourceId,
                });
                const resourceType = formatAzureResourceTypeForDisplay(row.resourceType);

                return (
                  <li key={row.cloudResourceId}>
                    <button
                      type="button"
                      id={`${controlId}-option-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      className={cn(
                        "w-full rounded px-2 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800",
                        index === activeIndex ? "bg-neutral-100 dark:bg-neutral-800" : undefined,
                      )}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      onClick={() => {
                        selectOption(row);
                      }}
                    >
                      <span className="font-medium text-al-text-primary">{displayName}</span>
                      <span className="block text-al-text-secondary">
                        {resourceType} · <span className="font-mono text-xs">{row.cloudResourceId}</span>
                      </span>
                    </button>
                  </li>
                );
              })
            : null}
        </ul>
      ) : null}
    </div>
  );
}
