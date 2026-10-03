import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";
import {
  OPERATOR_SCOPE_STORAGE_KEY,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";

const persistedScope: OperatorScopeRecord = {
  tenantId: "tenant-1",
  workspaceId: "workspace-1",
  projectId: "project-1",
  workspaceLabel: "Workspace",
  projectLabel: "Project",
};

describe("GovernanceFindingsQueueClient scope snapshot", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(OPERATOR_SCOPE_STORAGE_KEY, JSON.stringify(persistedScope));
  });

  it("does not rerender forever when a persisted operator scope exists", () => {
    const { result } = renderHook(() => useOperatorScopeRecord());

    expect(result.current).toEqual(persistedScope);
  });
});
