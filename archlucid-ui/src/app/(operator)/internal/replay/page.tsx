import { permanentRedirect } from "next/navigation";

import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";

/** Retired IA path — canonical surface is `/internal/validate-route`. */
export default function LegacyInternalReplayPage(): never {
  permanentRedirect(INTERNAL_REPLAY_PATH);
}
