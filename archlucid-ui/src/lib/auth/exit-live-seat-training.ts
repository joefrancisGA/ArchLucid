import {
  setUserFirstSessionPurpose,
  setUserWorkingCareerRehearsalDoor,
  setUserWorkspaceMode,
} from "@/lib/api/user-preferences";
import {
  bootstrapDedicatedWorkspaceScope,
  returnToDedicatedWorkspaceFromSample,
} from "@/lib/operator/operator-scope-bootstrap";

/** Leave Training: dedicated live scope, Working + Record defaults, explicit live purpose (ADR 0102 / LS-014). */
export async function exitLiveSeatTraining(): Promise<boolean> {
  const returned = returnToDedicatedWorkspaceFromSample();

  if (!returned) {
    const bootstrapped = await bootstrapDedicatedWorkspaceScope();

    if (!bootstrapped) {
      return false;
    }
  }

  await setUserFirstSessionPurpose("live");
  await setUserWorkspaceMode("working");
  await setUserWorkingCareerRehearsalDoor("career");

  return true;
}
