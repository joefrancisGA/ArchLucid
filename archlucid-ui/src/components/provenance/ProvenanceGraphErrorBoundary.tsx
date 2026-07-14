"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
};

type State = {
  failed: boolean;
};

/** Catches unexpected graph render failures and surfaces the timeline/table fallback. */
export class ProvenanceGraphErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Intentionally avoid surfacing library diagnostics to reviewers.
  }

  render(): ReactNode {
    if (this.state.failed) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
