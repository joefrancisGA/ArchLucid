"use client";

import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import type { IdentityProvidersSettingsPageServerLoad } from "./load-identity-providers-settings-page-data";
import { IdentityProvidersSettingsRestrictedState } from "./IdentityProvidersSettingsRestrictedState";
import { useIdentityProvidersSettingsPage } from "./use-identity-providers-settings-page";

export type IdentityProvidersSettingsGateProps = {
  readonly loaded: IdentityProvidersSettingsPageServerLoad;
  readonly children: (model: ReturnType<typeof useIdentityProvidersSettingsPage>) => React.ReactNode;
};

export function IdentityProvidersSettingsGate(props: IdentityProvidersSettingsGateProps): React.JSX.Element {
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const model = useIdentityProvidersSettingsPage(props.loaded);

  if (callerAuthorityRank < AUTHORITY_RANK.AdminAuthority) {
    return <IdentityProvidersSettingsRestrictedState />;
  }

  if (model.accessDenied) {
    return <IdentityProvidersSettingsRestrictedState />;
  }

  return <>{props.children(model)}</>;
}
