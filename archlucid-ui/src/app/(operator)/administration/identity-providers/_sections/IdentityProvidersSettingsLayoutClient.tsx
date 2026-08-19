"use client";

import type { ReactNode } from "react";

import type { IdentityProvidersSettingsPageServerLoad } from "./load-identity-providers-settings-page-data";
import { IdentityProvidersSettingsProvider } from "./IdentityProvidersSettingsProvider";

export type IdentityProvidersSettingsLayoutClientProps = {
  readonly loaded: IdentityProvidersSettingsPageServerLoad;
  readonly children: ReactNode;
};

export function IdentityProvidersSettingsLayoutClient(
  props: IdentityProvidersSettingsLayoutClientProps,
): React.JSX.Element {
  return (
    <IdentityProvidersSettingsProvider loaded={props.loaded}>
      {props.children}
    </IdentityProvidersSettingsProvider>
  );
}
