"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { ApiV1Routes } from "@/lib/api-v1-routes";
import { extractEmailDomainForAnalytics } from "@/lib/marketing/extract-email-domain-for-analytics";
import { isSubmittableWorkEmail } from "@/lib/marketing/is-submittable-work-email";
import { recordMarketingCtaEarlyAccessSubmit } from "@/lib/marketing/marketing-clarity-custom-event";

export type UseMarketingEarlyAccessSubmitOptions = {
  /** Clarity dimension {@code cta_source}. */
  readonly source: string;
};

export type UseMarketingEarlyAccessSubmitResult = {
  readonly email: string;
  readonly setEmail: (value: string) => void;
  readonly companyName: string;
  readonly setCompanyName: (value: string) => void;
  readonly role: string;
  readonly setRole: (value: string) => void;
  readonly websiteUrl: string;
  readonly setWebsiteUrl: (value: string) => void;
  readonly busy: boolean;
  readonly done: boolean;
  readonly error: string | null;
  readonly emailValid: boolean;
  readonly showEmailFormatError: boolean;
  readonly canSubmit: boolean;
  readonly emailTouched: boolean;
  readonly onEmailBlur: () => void;
  readonly handleSubmit: (event: React.FormEvent) => Promise<void>;
};

export function useMarketingEarlyAccessSubmit(
  options: UseMarketingEarlyAccessSubmitOptions,
): UseMarketingEarlyAccessSubmitResult {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const emailValid = isSubmittableWorkEmail(email);
  const showEmailFormatError = emailTouched && email.trim().length > 0 && !emailValid;
  const canSubmit = emailValid && !busy;

  const onEmailBlur = useCallback(() => {
    setEmailTouched(true);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent): Promise<void> => {
      event.preventDefault();
      setEmailTouched(true);

      if (!canSubmit) {
        return;
      }

      setBusy(true);
      setError(null);

      try {
        const res = await fetch(`/api/proxy/${ApiV1Routes.marketingEarlyAccess}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            email,
            companyName: companyName.trim() === "" ? null : companyName.trim(),
            role: role.trim() === "" ? null : role.trim(),
            websiteUrl,
            utmSource: searchParams.get("utm_source") ?? null,
            utmMedium: searchParams.get("utm_medium") ?? null,
            utmCampaign: searchParams.get("utm_campaign") ?? null,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || res.statusText);
        }

        recordMarketingCtaEarlyAccessSubmit({
          source: options.source,
          email_domain: extractEmailDomainForAnalytics(email),
          utm_source: searchParams.get("utm_source") ?? undefined,
          utm_medium: searchParams.get("utm_medium") ?? undefined,
          utm_campaign: searchParams.get("utm_campaign") ?? undefined,
        });

        setDone(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Request failed.");
      } finally {
        setBusy(false);
      }
    },
    [canSubmit, companyName, email, options.source, role, searchParams, websiteUrl],
  );

  return {
    email,
    setEmail,
    companyName,
    setCompanyName,
    role,
    setRole,
    websiteUrl,
    setWebsiteUrl,
    busy,
    done,
    error,
    emailValid,
    showEmailFormatError,
    canSubmit,
    emailTouched,
    onEmailBlur,
    handleSubmit,
  };
}
