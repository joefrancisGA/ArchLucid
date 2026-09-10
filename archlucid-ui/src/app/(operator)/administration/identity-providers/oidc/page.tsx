import type { Metadata } from "next";

import { IdentityProvidersOidcPageClient } from "../_sections/IdentityProvidersOidcPageClient";
import {
  IDENTITY_PROVIDERS_OIDC_PAGE_METADATA_DESCRIPTION,
  IDENTITY_PROVIDERS_OIDC_PAGE_METADATA_TITLE,
} from "@/lib/identity-providers-settings-copy";

export const metadata: Metadata = {
  title: IDENTITY_PROVIDERS_OIDC_PAGE_METADATA_TITLE,
  description: IDENTITY_PROVIDERS_OIDC_PAGE_METADATA_DESCRIPTION,
};

export default function IdentityProvidersOidcPage(): React.JSX.Element {
  return <IdentityProvidersOidcPageClient />;
}
