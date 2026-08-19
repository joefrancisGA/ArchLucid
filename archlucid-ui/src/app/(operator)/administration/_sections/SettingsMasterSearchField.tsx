"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type SettingsMasterSearchFieldProps = {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly resultCount: number;
};

export function SettingsMasterSearchField(props: SettingsMasterSearchFieldProps) {
  return (
    <div className="space-y-2" data-testid="settings-master-search">
      <label className={cn("block font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} htmlFor="settings-master-search-input">
        Search settings
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden />
        <Input
          id="settings-master-search-input"
          type="search"
          value={props.value}
          placeholder="Search settings…"
          className="pl-9"
          onChange={(event) => props.onChange(event.target.value)}
        />
      </div>
      {props.value.trim().length > 0 ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {props.resultCount} matching {props.resultCount === 1 ? "section" : "sections"}
        </p>
      ) : null}
    </div>
  );
}
