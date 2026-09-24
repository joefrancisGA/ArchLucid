"use client";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { IdentityProvidersSettingsLoadingState } from "./IdentityProvidersSettingsLoadingState";
import { IdentityProvidersSettingsRestrictedState } from "./IdentityProvidersSettingsRestrictedState";
import { useIdentityProvidersSettingsModel } from "./IdentityProvidersSettingsProvider";

export type IdentityProvidersSettingsGateProps = {
  readonly children: (model: ReturnType<typeof useIdentityProvidersSettingsModel>) => React.ReactNode;
};

export function IdentityProvidersSettingsGate(props: IdentityProvidersSettingsGateProps): React.JSX.Element {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const model = useIdentityProvidersSettingsModel();

  if (isAuthorityLoading) {
    return <IdentityProvidersSettingsLoadingState />;
  }

  if (callerAuthorityRank < AUTHORITY_RANK.AdminAuthority) {
    return <IdentityProvidersSettingsRestrictedState />;
  }

  if (model.accessDenied) {
    return <IdentityProvidersSettingsRestrictedState />;
  }

  return <>{props.children(model)}</>;
}
