"use client";

import { useEffect, useState } from "react";

import { getDemoExplain } from "@/lib/api";

import { demoExplainToSectionError } from "./demo-explain-page-helpers";
import { demoExplainPageInitialState, type DemoExplainPageState } from "./demo-explain-page-types";

export function useDemoExplainPage(): DemoExplainPageState {
  const [state, setState] = useState<DemoExplainPageState>(demoExplainPageInitialState);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const payload = await getDemoExplain();

        if (cancelled) {
          return;
        }

        if (payload === null) {
          setState({ payload: null, notFound: true, error: null, loading: false });

          return;
        }

        setState({ payload, notFound: false, error: null, loading: false });
      } catch (e: unknown) {
        if (cancelled) {
          return;
        }

        setState({
          payload: null,
          notFound: false,
          error: demoExplainToSectionError(e, "Could not load the demo explain payload."),
          loading: false,
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
