import { Metadata } from "next";

import { PortfolioPageView } from "./_sections/PortfolioPageView";

export const metadata: Metadata = {
  title: "Cross-Tenant Portfolio | ArchLucid",
};

export default function PortfolioPage() {
  return <PortfolioPageView />;
}
