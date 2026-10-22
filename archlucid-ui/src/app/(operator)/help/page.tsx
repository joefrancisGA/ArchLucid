import type { Metadata } from "next";

import { HelpPageView } from "./HelpPageView";

export const metadata: Metadata = {
  title: "Help",
};

/** Single guides list — admin and engineering topics stay behind Show advanced topics. */
export default function HelpPage() {
  return <HelpPageView />;
}
