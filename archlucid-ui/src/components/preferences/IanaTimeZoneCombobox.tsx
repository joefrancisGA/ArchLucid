"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { resolveBrowserTimeZoneId } from "@/lib/advisory-schedule-form";
import {
  formatIanaTimeZoneCurrentTimePreview,
  formatIanaTimeZoneFriendlyTitle,
  formatIanaTimeZoneUtcOffsetLabel,
  listIanaTimeZoneDisplayEntries,
  resolveIanaTimeZoneDisplayEntry,
  searchIanaTimeZoneDisplayEntries,
  sortIanaTimeZoneDisplayEntries,
  type IanaTimeZoneDisplayEntry,
} from "@/lib/iana-time-zone-display";
import { readRecentIanaTimeZoneIds, recordRecentIanaTimeZoneId } from "@/lib/iana-time-zone-recent";
import { toStoredIanaTimeZoneId } from "@/lib/iana-time-zone-select";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_TIME_ZONES = 80;

export type IanaTimeZoneComboboxProps = {
  readonly ianaTimeZoneId: string;
  readonly onIanaTimeZoneIdChange: (nextIanaTimeZoneId: string) => void;
  readonly labelledById?: string;
  readonly controlId?: string;
};

type TimeZoneOptionRowProps = {
  readonly entry: IanaTimeZoneDisplayEntry;
  readonly selected: boolean;
  readonly active: boolean;
  readonly optionId: string;
  readonly onSelect: (ianaTimeZoneId: string) => void;
};

function TimeZoneOptionRow(props: TimeZoneOptionRowProps): React.JSX.Element {
  return (
    <button
      type="button"
      role="option"
      id={props.optionId}
      aria-selected={props.selected}
      data-active={props.active ? "true" : undefined}
      className={cn(
        "flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition-colors",
        props.active ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900/60",
      )}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={() => {
        props.onSelect(props.entry.ianaTimeZoneId);
      }}
    >
      <span className="min-w-0">
        <span className={cn("block font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {formatIanaTimeZoneFriendlyTitle(props.entry.ianaTimeZoneId)}
        </span>
        <span className={cn("mt-0.5 block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {props.entry.ianaTimeZoneId} · {formatIanaTimeZoneUtcOffsetLabel(props.entry.ianaTimeZoneId)}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {formatIanaTimeZoneUtcOffsetLabel(props.entry.ianaTimeZoneId)}
        </span>
        {props.selected ? <Check className="size-4 text-al-text-primary" aria-hidden /> : null}
      </span>
    </button>
  );
}

function TimeZoneSectionLabel(props: { readonly children: string }): React.JSX.Element {
  return (
    <div
      className={cn(
        "px-3 pb-1 pt-2 font-medium uppercase tracking-wide text-al-text-secondary",
        OPERATOR_TYPOGRAPHY.micro,
      )}
    >
      {props.children}
    </div>
  );
}

export function IanaTimeZoneCombobox({
  ianaTimeZoneId,
  onIanaTimeZoneIdChange,
  labelledById,
  controlId,
}: IanaTimeZoneComboboxProps): React.JSX.Element {
  const generatedId = useId();
  const buttonId = controlId ?? `iana-time-zone-combobox-${generatedId}`;
  const listboxId = `${buttonId}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const blurTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentTimeZoneIds, setRecentTimeZoneIds] = useState<readonly string[]>([]);

  const normalizedValue = toStoredIanaTimeZoneId(ianaTimeZoneId);
  const deviceTimeZoneId = resolveBrowserTimeZoneId();
  const allEntries = useMemo(() => sortIanaTimeZoneDisplayEntries(listIanaTimeZoneDisplayEntries()), []);
  const filteredEntries = useMemo(
    () => searchIanaTimeZoneDisplayEntries(searchQuery, allEntries).slice(0, MAX_VISIBLE_TIME_ZONES),
    [allEntries, searchQuery],
  );
  const recentEntries = useMemo(
    () =>
      recentTimeZoneIds
        .map((id) => resolveIanaTimeZoneDisplayEntry(id))
        .filter((entry) => searchIanaTimeZoneDisplayEntries(searchQuery, [entry]).length > 0),
    [recentTimeZoneIds, searchQuery],
  );
  const showRecentSection = recentEntries.length > 0 && searchQuery.trim().length === 0;
  const showAllSection = filteredEntries.length > 0;
  const flatOptions = useMemo(() => {
    const options: IanaTimeZoneDisplayEntry[] = [];

    if (searchQuery.trim().length === 0) {
      options.push(resolveIanaTimeZoneDisplayEntry(deviceTimeZoneId));
    }

    if (showRecentSection) {
      options.push(...recentEntries);
    }

    if (showAllSection) {
      const recentIds = new Set(recentEntries.map((entry) => entry.ianaTimeZoneId));
      const deviceAlreadyListed = options.some((entry) => entry.ianaTimeZoneId === deviceTimeZoneId);

      for (const entry of filteredEntries) {
        if (searchQuery.trim().length === 0 && entry.ianaTimeZoneId === deviceTimeZoneId && deviceAlreadyListed) {
          continue;
        }

        if (showRecentSection && recentIds.has(entry.ianaTimeZoneId)) {
          continue;
        }

        options.push(entry);
      }
    }

    return options;
  }, [
    deviceTimeZoneId,
    filteredEntries,
    recentEntries,
    searchQuery,
    showAllSection,
    showRecentSection,
  ]);

  useEffect(() => {
    setRecentTimeZoneIds(readRecentIanaTimeZoneIds());
  }, []);

  useEffect(() => {
    if (!open) {
      setActiveIndex(-1);
      return;
    }

    searchInputRef.current?.focus();

    if (flatOptions.length === 0) {
      setActiveIndex(-1);
      return;
    }

    const selectedIndex = flatOptions.findIndex((entry) => entry.ianaTimeZoneId === normalizedValue);

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [flatOptions, normalizedValue, open]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }

      setOpen(false);
      setSearchQuery("");
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const scheduleClose = () => {
    if (blurTimerRef.current !== null) {
      window.clearTimeout(blurTimerRef.current);
    }

    blurTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      setSearchQuery("");
    }, 120);
  };

  const selectTimeZone = (nextIanaTimeZoneId: string) => {
    const normalized = toStoredIanaTimeZoneId(nextIanaTimeZoneId);

    recordRecentIanaTimeZoneId(normalized);
    setRecentTimeZoneIds(readRecentIanaTimeZoneIds());
    onIanaTimeZoneIdChange(normalized);
    setOpen(false);
    setSearchQuery("");
  };

  const selectDeviceTimeZone = () => {
    selectTimeZone(deviceTimeZoneId);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setSearchQuery("");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (flatOptions.length === 0) {
        return;
      }

      setActiveIndex((previous) => (previous < flatOptions.length - 1 ? previous + 1 : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (flatOptions.length === 0) {
        return;
      }

      setActiveIndex((previous) => (previous > 0 ? previous - 1 : flatOptions.length - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && flatOptions[activeIndex] !== undefined) {
      event.preventDefault();

      if (searchQuery.trim().length === 0 && activeIndex === 0) {
        selectDeviceTimeZone();
        return;
      }

      selectTimeZone(flatOptions[activeIndex].ianaTimeZoneId);
    }
  };

  let renderedOptionIndex = -1;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl" data-testid="iana-time-zone-combobox">
      <button
        id={buttonId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-labelledby={labelledById}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-visible:ring-neutral-600",
          OPERATOR_TYPOGRAPHY.body,
        )}
        onClick={() => {
          setOpen((previous) => !previous);
        }}
        onBlur={scheduleClose}
        data-testid="iana-time-zone-combobox-trigger"
      >
        <span className="min-w-0 truncate font-medium text-al-text-primary">
          {formatIanaTimeZoneFriendlyTitle(normalizedValue)}
        </span>
        <span className="flex shrink-0 items-center gap-2 text-al-text-secondary">
          <span className={OPERATOR_TYPOGRAPHY.helper}>{formatIanaTimeZoneUtcOffsetLabel(normalizedValue)}</span>
          <ChevronDown className="size-4 shrink-0" aria-hidden />
        </span>
      </button>

      {open ? (
        <div
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
          data-testid="iana-time-zone-combobox-panel"
        >
          <div className="border-b border-neutral-200 p-2 dark:border-neutral-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-al-text-secondary" aria-hidden />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                placeholder="Search city or time zone..."
                aria-label="Search city or time zone"
                className={cn("h-9 pl-8", OPERATOR_TYPOGRAPHY.body)}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                }}
                onKeyDown={handleSearchKeyDown}
                onBlur={scheduleClose}
                data-testid="iana-time-zone-combobox-search"
              />
            </div>
          </div>

          <div
            id={listboxId}
            role="listbox"
            aria-labelledby={labelledById}
            className="max-h-80 overflow-y-auto"
          >
            {searchQuery.trim().length === 0 ? (
              <div className="border-b border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  role="option"
                  aria-selected={normalizedValue === deviceTimeZoneId}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition-colors",
                    activeIndex === 0
                      ? "bg-neutral-100 dark:bg-neutral-900"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-900/60",
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={selectDeviceTimeZone}
                  data-testid="iana-time-zone-combobox-device-option"
                >
                  <span className="min-w-0">
                    <span className={cn("block font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                      Use device time zone
                    </span>
                    <span className={cn("mt-0.5 block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {formatIanaTimeZoneFriendlyTitle(deviceTimeZoneId)} ·{" "}
                      {formatIanaTimeZoneUtcOffsetLabel(deviceTimeZoneId)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {formatIanaTimeZoneUtcOffsetLabel(deviceTimeZoneId)}
                    </span>
                    {normalizedValue === deviceTimeZoneId ? (
                      <Check className="size-4 text-al-text-primary" aria-hidden />
                    ) : null}
                  </span>
                </button>
              </div>
            ) : null}

            {showRecentSection ? (
              <div>
                <TimeZoneSectionLabel>Recent</TimeZoneSectionLabel>
                {recentEntries.map((entry) => {
                  renderedOptionIndex += 1;
                  const optionIndex = renderedOptionIndex;

                  return (
                    <TimeZoneOptionRow
                      key={`recent-${entry.ianaTimeZoneId}`}
                      entry={entry}
                      selected={entry.ianaTimeZoneId === normalizedValue}
                      active={activeIndex === optionIndex}
                      optionId={`${buttonId}-option-${optionIndex}`}
                      onSelect={selectTimeZone}
                    />
                  );
                })}
              </div>
            ) : null}

            {showAllSection ? (
              <div>
                {searchQuery.trim().length === 0 ? <TimeZoneSectionLabel>All time zones</TimeZoneSectionLabel> : null}
                {filteredEntries.map((entry) => {
                  if (
                    searchQuery.trim().length === 0 &&
                    (entry.ianaTimeZoneId === deviceTimeZoneId ||
                      recentEntries.some((recent) => recent.ianaTimeZoneId === entry.ianaTimeZoneId))
                  ) {
                    return null;
                  }

                  renderedOptionIndex += 1;
                  const optionIndex = renderedOptionIndex;

                  return (
                    <TimeZoneOptionRow
                      key={entry.ianaTimeZoneId}
                      entry={entry}
                      selected={entry.ianaTimeZoneId === normalizedValue}
                      active={activeIndex === optionIndex}
                      optionId={`${buttonId}-option-${optionIndex}`}
                      onSelect={selectTimeZone}
                    />
                  );
                })}
              </div>
            ) : null}

            {flatOptions.length === 0 ? (
              <p className={cn("px-3 py-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                No matching time zones.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-2 space-y-0.5" data-testid="iana-time-zone-current-time-preview">
        <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {formatIanaTimeZoneFriendlyTitle(normalizedValue)}
        </p>
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {formatIanaTimeZoneCurrentTimePreview(normalizedValue)}
        </p>
      </div>
    </div>
  );
}
