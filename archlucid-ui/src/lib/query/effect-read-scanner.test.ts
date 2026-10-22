import { describe, expect, it } from "vitest";

import { findEffectReadsInSource } from "@/lib/query/effect-read-scanner";

describe("findEffectReadsInSource", () => {
  it("returns nothing for a module without effects", () => {
    expect(findEffectReadsInSource("export const value = await fetch('/v1/runs');")).toEqual([]);
  });

  it("returns nothing for absent source", () => {
    expect(findEffectReadsInSource(null)).toEqual([]);
    expect(findEffectReadsInSource(undefined)).toEqual([]);
  });

  it("reports a bare fetch inside an effect", () => {
    const source = `
      useEffect(() => {
        void fetch("/v1/runs").then(setRuns);
      }, []);
    `;

    expect(findEffectReadsInSource(source)).toEqual(["fetch"]);
  });

  it("reports a call imported from an api module", () => {
    const source = `
      import { getRunSummary } from "@/lib/api/runs-api";

      useEffect(() => {
        void getRunSummary(runId).then(setSummary);
      }, [runId]);
    `;

    expect(findEffectReadsInSource(source)).toEqual(["getRunSummary"]);
  });

  it("resolves an aliased import to the name used at the call site", () => {
    const source = `
      import { getRunSummary as loadSummary } from "@/lib/api/runs-api";

      useEffect(() => {
        void loadSummary(runId);
      }, [runId]);
    `;

    expect(findEffectReadsInSource(source)).toEqual(["loadSummary"]);
  });

  it("ignores calls imported from non-network modules", () => {
    const source = `
      import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

      useEffect(() => {
        setKey(operatorQueryKeys(scope));
      }, [scope]);
    `;

    expect(findEffectReadsInSource(source)).toEqual([]);
  });

  it("ignores member calls that only look like reads", () => {
    const source = `
      useEffect(() => {
        const raw = window.localStorage.getItem("scope");
        document.getElementById("root")?.focus();
        setScope(raw);
      }, []);
    `;

    expect(findEffectReadsInSource(source)).toEqual([]);
  });

  it("follows a local loader function declared beside the effect", () => {
    const source = `
      import { getRunSummary } from "@/lib/api/runs-api";

      async function loadSummary(runId: string): Promise<void> {
        setSummary(await getRunSummary(runId));
      }

      useEffect(() => {
        void loadSummary(runId);
      }, [runId]);
    `;

    expect(findEffectReadsInSource(source)).toEqual(["getRunSummary"]);
  });

  it("follows a local loader declared as an arrow constant", () => {
    const source = `
      import { getRunSummary } from "@/lib/api/runs-api";

      const loadSummary = async (runId: string) => {
        setSummary(await getRunSummary(runId));
      };

      useEffect(() => {
        void loadSummary(runId);
      }, [runId]);
    `;

    expect(findEffectReadsInSource(source)).toEqual(["getRunSummary"]);
  });

  it("skips effects that open a stream", () => {
    const source = `
      useEffect(() => {
        const stream = new EventSource("/v1/runs/stream");
        void fetch("/v1/runs/seed");

        return () => stream.close();
      }, []);
    `;

    expect(findEffectReadsInSource(source)).toEqual([]);
  });

  it("skips effects that poll on an interval", () => {
    const source = `
      useEffect(() => {
        const timer = setInterval(() => {
          void fetch("/v1/runs");
        }, 5000);

        return () => clearInterval(timer);
      }, []);
    `;

    expect(findEffectReadsInSource(source)).toEqual([]);
  });

  it("keeps a read from a non-streaming effect in the same module as a streaming one", () => {
    const source = `
      useEffect(() => {
        const stream = new EventSource("/v1/runs/stream");

        return () => stream.close();
      }, []);

      useEffect(() => {
        void fetch("/v1/runs");
      }, []);
    `;

    expect(findEffectReadsInSource(source)).toEqual(["fetch"]);
  });

  it("reports each distinct read once, sorted", () => {
    const source = `
      import { getRunSummary, listRuns } from "@/lib/api/runs-api";

      useEffect(() => {
        void listRuns();
        void getRunSummary(runId);
        void getRunSummary(otherId);
      }, [runId, otherId]);
    `;

    expect(findEffectReadsInSource(source)).toEqual(["getRunSummary", "listRuns"]);
  });

  it("does not mistake nested closing parens for the end of the effect", () => {
    const source = `
      useEffect(() => {
        if (enabled && (scope.length > 0)) {
          setReady(true);
        }

        void fetch("/v1/runs");
      }, [enabled, scope]);
    `;

    expect(findEffectReadsInSource(source)).toEqual(["fetch"]);
  });
});
