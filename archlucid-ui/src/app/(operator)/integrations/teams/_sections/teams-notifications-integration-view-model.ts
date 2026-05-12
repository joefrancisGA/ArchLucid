import type { Dispatch, SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { TeamsIncomingWebhookConnectionResponse } from "@/types/teams-incoming-webhook-connection";

export type TeamsNotificationsIntegrationPageViewModel = {
  readonly isDemo: boolean;
  readonly canMutate: boolean;
  readonly loading: boolean;
  readonly saving: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly conn: TeamsIncomingWebhookConnectionResponse | null;
  readonly secretName: string;
  readonly setSecretName: Dispatch<SetStateAction<string>>;
  readonly label: string;
  readonly setLabel: Dispatch<SetStateAction<string>>;
  readonly catalog: string[];
  readonly enabledTriggers: ReadonlySet<string>;
  readonly toggleTrigger: (eventType: string, checked: boolean) => void;
  readonly load: () => Promise<void>;
  readonly onSave: () => Promise<void>;
  readonly onRemove: () => Promise<void>;
};
