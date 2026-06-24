import { redirect } from "next/navigation";

/** Legacy settings path — webhooks are integration configuration under Operate · operations. */
export default function WebhooksSettingsRedirectPage() {
  redirect("/integrations/webhooks");
}
