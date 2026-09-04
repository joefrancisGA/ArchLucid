import * as httpApi from "@/lib/api/http";
import type { WorkspaceModeId } from "@/lib/workspace-mode/workspace-mode";
import type { WorkspaceModeGraduationOfferState } from "@/lib/workspace-mode/workspace-mode-preference";

import { patchUserPreferencesCache } from "./user-preferences-cache";
import type {
  SetProfessionalWorkbenchEnabledRequest,
  SetWorkspaceModeGraduationOfferRequest,
  SetWorkspaceModeRequest,
} from "./user-preferences-types";

export async function setUserWorkspaceMode(mode: WorkspaceModeId): Promise<void> {
  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/workspace-mode",
    { mode } satisfies SetWorkspaceModeRequest,
  );

  patchUserPreferencesCache({
    workspaceMode: mode,
    workspaceModeIsExplicit: true,
  });
}

export async function setUserWorkspaceModeGraduationOffer(
  state: WorkspaceModeGraduationOfferState,
): Promise<void> {
  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/workspace-mode-graduation-offer",
    { state } satisfies SetWorkspaceModeGraduationOfferRequest,
  );

  patchUserPreferencesCache({
    workspaceModeGraduationOffer: state,
    workspaceModeGraduationOfferIsExplicit: true,
  });
}

export async function setUserProfessionalWorkbenchEnabled(enabled: boolean): Promise<void> {
  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/professional-workbench",
    { enabled } satisfies SetProfessionalWorkbenchEnabledRequest,
  );

  patchUserPreferencesCache({
    professionalWorkbenchEnabled: enabled,
    professionalWorkbenchEnabledIsExplicit: true,
  });
}
