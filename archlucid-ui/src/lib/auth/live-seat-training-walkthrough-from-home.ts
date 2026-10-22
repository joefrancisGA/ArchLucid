import {
  setUserFirstSessionPurpose,
  setUserWorkspaceMode,
} from "@/lib/api/user-preferences";
import { visitSampleWorkspaceScope } from "@/lib/operator/operator-scope-actions";

/** Secondary empty-Home CTA — enters Training (Guided + explicit sample visit). */
export async function beginLiveSeatTrainingWalkthroughFromHome(): Promise<void> {
  await setUserFirstSessionPurpose("training");
  await setUserWorkspaceMode("guided");
  visitSampleWorkspaceScope();
}
