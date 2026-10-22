import type { Metadata } from "next";

import { IdentityProvidersDiagnosticsPageClient } from "../_sections/IdentityProvidersDiagnosticsPageClient";
import {
  IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_METADATA_DESCRIPTION,
  IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_METADATA_TITLE,
} from "@/lib/identity-providers-settings-copy";

export const metadata: Metadata = {
  title: IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_METADATA_TITLE,
  description: IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_METADATA_DESCRIPTION,
};

export default function IdentityProvidersDiagnosticsPage(): React.JSX.Element {
  return <IdentityProvidersDiagnosticsPageClient />;
}
