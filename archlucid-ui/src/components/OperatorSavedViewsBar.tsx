"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { toApiLoadFailure, type ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  createOperatorSavedView,
  deleteOperatorSavedView,
  listOperatorSavedViews,
  type OperatorSavedView,
} from "@/lib/api/operator-saved-views";
import type { OperatorSavedViewPayload, OperatorSavedViewSurface } from "@/lib/operator-saved-view-types";
import { cn } from "@/lib/utils";

type UseOperatorSavedViewsOptions = {
  surface: OperatorSavedViewSurface;
  enabled?: boolean;
};

/** Loads, creates, and deletes tenant/user-scoped operator saved views for one surface. */
export function useOperatorSavedViews(options: UseOperatorSavedViewsOptions) {
  const { surface, enabled = true } = options;
  const [views, setViews] = useState<OperatorSavedView[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [selectedViewId, setSelectedViewId] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    setFailure(null);

    try {
      const nextViews = await listOperatorSavedViews(surface);
      setViews(nextViews);
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    } finally {
      setLoading(false);
    }
  }, [enabled, surface]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveView = useCallback(
    async (name: string, payload: OperatorSavedViewPayload, isShared: boolean) => {
      setSaving(true);
      setFailure(null);

      try {
        const created = await createOperatorSavedView({ surface, name, payload, isShared });
        setViews((current) => [...current, created].sort((left, right) => left.name.localeCompare(right.name)));
        setSelectedViewId(created.id);

        return created;
      } catch (error) {
        setFailure(toApiLoadFailure(error));
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [surface],
  );

  const deleteSelectedView = useCallback(async () => {
    if (selectedViewId.trim().length === 0) {
      return;
    }

    setDeleting(true);
    setFailure(null);

    try {
      await deleteOperatorSavedView(selectedViewId);
      setViews((current) => current.filter((view) => view.id !== selectedViewId));
      setSelectedViewId("");
    } catch (error) {
      setFailure(toApiLoadFailure(error));
      throw error;
    } finally {
      setDeleting(false);
    }
  }, [selectedViewId]);

  const selectedView = views.find((view) => view.id === selectedViewId) ?? null;

  return {
    views,
    loading,
    saving,
    deleting,
    failure,
    selectedViewId,
    setSelectedViewId,
    selectedView,
    refresh,
    saveView,
    deleteSelectedView,
  };
}

export type OperatorSavedViewsBarProps = {
  surface: OperatorSavedViewSurface;
  disabled?: boolean;
  className?: string;
  getCurrentPayload: () => OperatorSavedViewPayload;
  onLoadView: (view: OperatorSavedView) => void | Promise<void>;
};

/** Save, load, and delete controls for operator Audit and Graph saved views. */
export function OperatorSavedViewsBar(props: OperatorSavedViewsBarProps) {
  const { surface, disabled = false, className, getCurrentPayload, onLoadView } = props;
  const {
    views,
    loading,
    saving,
    deleting,
    failure,
    selectedViewId,
    setSelectedViewId,
    selectedView,
    saveView,
    deleteSelectedView,
  } = useOperatorSavedViews({ surface, enabled: !disabled });
  const [saveName, setSaveName] = useState("");
  const [saveShared, setSaveShared] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const myViews = views.filter((view) => view.isOwnedByCurrentUser !== false);
  const sharedViews = views.filter((view) => view.isShared === true && view.isOwnedByCurrentUser === false);

  const handleLoad = async () => {
    if (selectedView === null) {
      return;
    }

    setStatusMessage(null);
    await onLoadView(selectedView);
    setStatusMessage(`Loaded “${selectedView.name}”.`);
  };

  const handleSave = async () => {
    const trimmedName = saveName.trim();

    if (trimmedName.length === 0) {
      setStatusMessage("Enter a name before saving this view.");

      return;
    }

    setStatusMessage(null);

    try {
      const created = await saveView(trimmedName, getCurrentPayload(), saveShared);
      setSaveName("");
      setSaveShared(false);
      setStatusMessage(`Saved “${created.name}”.`);
    } catch {
      setStatusMessage("Could not save this view — check the name is unique.");
    }
  };

  const handleDelete = async () => {
    if (selectedView === null) {
      return;
    }

    const deletedName = selectedView.name;
    setStatusMessage(null);

    try {
      await deleteSelectedView();
      setStatusMessage(`Deleted “${deletedName}”.`);
    } catch {
      setStatusMessage("Could not delete the selected view.");
    }
  };

  return (
    <div
      className={cn(
        "mb-3 flex flex-col gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/60",
        className,
      )}
      data-testid={`operator-saved-views-${surface}`}
    >
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[12rem] flex-1 text-xs font-medium text-neutral-700 dark:text-neutral-200">
          Saved views
          <select
            value={selectedViewId}
            onChange={(event) => setSelectedViewId(event.target.value)}
            disabled={disabled || loading || views.length === 0}
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-950"
            aria-label={`Load saved ${surface} view`}
          >
            <option value="">{loading ? "Loading…" : views.length === 0 ? "No saved views" : "Select a view"}</option>
            {myViews.length > 0 ? (
              <optgroup label="My views">
                {myViews.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                    {view.isShared ? " (shared)" : ""}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {sharedViews.length > 0 ? (
              <optgroup label="Shared views">
                {sharedViews.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || loading || selectedView === null}
          onClick={() => void handleLoad()}
        >
          Load view
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || loading || deleting || selectedView === null || selectedView.isOwnedByCurrentUser === false}
          onClick={() => void handleDelete()}
        >
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[12rem] flex-1 text-xs font-medium text-neutral-700 dark:text-neutral-200">
          Save current view as
          <input
            value={saveName}
            onChange={(event) => setSaveName(event.target.value)}
            disabled={disabled || saving}
            placeholder="My daily audit filters"
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-950"
            aria-label={`Name for new ${surface} saved view`}
          />
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs text-neutral-700 dark:text-neutral-200">
          <input
            type="checkbox"
            checked={saveShared}
            disabled={disabled || saving}
            onChange={(event) => setSaveShared(event.target.checked)}
          />
          Share with team
        </label>
        <Button type="button" variant="primary" size="sm" disabled={disabled || saving} onClick={() => void handleSave()}>
          {saving ? "Saving…" : "Save view"}
        </Button>
      </div>
      {failure !== null ? (
        <p className="m-0 text-xs text-red-700 dark:text-red-300" role="alert">
          {failure.message}
        </p>
      ) : null}
      {statusMessage !== null ? (
        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400" role="status">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
