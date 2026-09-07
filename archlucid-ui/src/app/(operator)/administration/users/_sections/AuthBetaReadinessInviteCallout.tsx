"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { OperatorWarningCallout } from "@/components/operator/OperatorShellMessage";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  resolveAuthBetaReadinessInviteBlockers,
  type AdminAuthConfigurationDiagnosticsResponse,
} from "@/lib/auth/auth-beta-readiness-invite-blockers";
import { proxyJsonGet } from "@/lib/proxy-json-client";
import { cn } from "@/lib/utils";

const IDENTITY_PROVIDERS_SETTINGS_PATH = "/administration/identity-providers";

/** Warns admins when invite accept cannot complete for private-beta users (TB-928). */
export function AuthBetaReadinessInviteCallout(): React.ReactElement | null {
  const [config, setConfig] = useState<AdminAuthConfigurationDiagnosticsResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void proxyJsonGet<AdminAuthConfigurationDiagnosticsResponse>(
      "/api/proxy/v1/admin/auth/configuration-diagnostics",
      { cache: "no-store" },
    )
      .then((response) => {
        if (!cancelled) {
          setConfig(response);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConfig(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) {
    return null;
  }

  const blockers = resolveAuthBetaReadinessInviteBlockers(config);

  if (blockers.length === 0) {
    return null;
  }

  return (
    <OperatorWarningCallout data-testid="auth-beta-readiness-invite-callout">
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Private-beta invite readiness
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Fix these before inviting private-beta users — otherwise accept links or post-accept sessions may fail.
      </p>
      <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
        {blockers.map((blocker) => (
          <li key={blocker.id}>
            <span className="font-medium text-al-text-primary">{blocker.label}</span>
            {": "}
            {blocker.detail}
          </li>
        ))}
      </ul>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
        <Link href={IDENTITY_PROVIDERS_SETTINGS_PATH} className={OPERATOR_LINK.inline}>
          Open identity provider diagnostics
        </Link>
      </p>
    </OperatorWarningCallout>
  );
}
