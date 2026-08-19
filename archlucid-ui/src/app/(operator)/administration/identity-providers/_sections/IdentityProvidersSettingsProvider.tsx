"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { IdentityProvidersSettingsPageServerLoad } from "./load-identity-providers-settings-page-data";
import {
  useIdentityProvidersSettingsPage,
  type UseIdentityProvidersSettingsPageModel,
} from "./use-identity-providers-settings-page";

const IdentityProvidersSettingsContext = createContext<UseIdentityProvidersSettingsPageModel | undefined>(undefined);

export type IdentityProvidersSettingsProviderProps = {
  readonly loaded: IdentityProvidersSettingsPageServerLoad;
  readonly children: ReactNode;
};

/** Shares one diagnostics load across identity-provider settings tabs (overview, SAML, OIDC, …). */
export function IdentityProvidersSettingsProvider(props: IdentityProvidersSettingsProviderProps): React.JSX.Element {
  const model = useIdentityProvidersSettingsPage(props.loaded);

  return (
    <IdentityProvidersSettingsContext.Provider value={model}>
      {props.children}
    </IdentityProvidersSettingsContext.Provider>
  );
}

export function useIdentityProvidersSettingsModel(): UseIdentityProvidersSettingsPageModel {
  const model = useContext(IdentityProvidersSettingsContext);

  if (model === undefined) {
    throw new Error("useIdentityProvidersSettingsModel must be used within IdentityProvidersSettingsProvider");
  }

  return model;
}
