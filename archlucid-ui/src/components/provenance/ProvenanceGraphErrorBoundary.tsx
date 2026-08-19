"use client";

import { Component, type ReactNode } from "react";

type Props = {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
  readonly onRenderFailed?: () => void;
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

  componentDidCatch(): void {
    this.props.onRenderFailed?.();
  }

  render(): ReactNode {
    if (this.state.failed) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
