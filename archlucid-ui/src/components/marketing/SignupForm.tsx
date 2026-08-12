"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import { MARKETING_SURFACES, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readFirstTouchCookie, serializeFirstTouchHeader } from "@/lib/marketing-first-touch";
import {
  companySizeOptions,
  industryVerticalOptions,
  signupFormSchema,
  type SignupFormValues,
} from "@/lib/signup-schema";
import { showError, showSuccess } from "@/lib/toast";
import { whyDisabledIncompleteInput } from "@/lib/why-disabled-cta";
import { cn } from "@/lib/utils";

type TenantProvisioningResult = {
  tenantId?: string;
  defaultWorkspaceId?: string;
  defaultProjectId?: string;
  wasAlreadyProvisioned?: boolean;
};

const optionalFieldLabelClass = cn("font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.body);

/** Self-service signup: posts to `POST /v1/register` via same-origin API proxy. */
export function SignupForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      adminEmail: "",
      adminDisplayName: "",
      organizationName: "",
      companySize: undefined,
      architectureTeamSize: "",
      industryVertical: undefined,
      industryVerticalOther: "",
    },
    mode: "onChange",
  });

  const { register, handleSubmit, setValue, watch, formState } = form;
  const values = watch();
  const companySize = values.companySize;
  const industryVertical = values.industryVertical;
  // TB-2010 — disable primary until hard client validation passes (no validation toast).
  const canSubmit = signupFormSchema.safeParse(values).success;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        organizationName: values.organizationName,
        adminEmail: values.adminEmail,
        adminDisplayName: values.adminDisplayName,
      };

      if (values.companySize) {
        payload.companySize = values.companySize;
      }

      const teamTrim = values.architectureTeamSize?.trim() ?? "";

      if (teamTrim.length > 0) {
        const t = Number(teamTrim);

        if (Number.isFinite(t)) {
          payload.architectureTeamSize = t;
        }
      }

      if (values.industryVertical) {
        payload.industryVertical = values.industryVertical;
      }

      if (values.industryVertical === "Other") {
        const o = values.industryVerticalOther?.trim() ?? "";

        if (o.length > 0) {
          payload.industryVerticalOther = o;
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      const firstTouch = readFirstTouchCookie();

      if (firstTouch) {
        headers["x-archlucid-first-touch"] = serializeFirstTouchHeader(firstTouch);
      }

      const res = await fetch("/api/proxy/v1/register", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let body: TenantProvisioningResult | { detail?: string } | null = null;

      try {
        body = text.length > 0 ? (JSON.parse(text) as TenantProvisioningResult) : null;
      } catch {
        body = null;
      }

      if (res.status === 409) {
        showError("Signup", "That organization name is already registered.");

        return;
      }

      if (!res.ok) {
        const detail =
          body && typeof body === "object" && "detail" in body && typeof body.detail === "string"
            ? body.detail
            : text || `Request failed (${res.status})`;
        showError("Signup", detail);

        return;
      }

      if (values.companySize) {
        try {
          sessionStorage.setItem("archlucid_signup_company_size", values.companySize);
        } catch {
          /* ignore */
        }
      }

      try {
        sessionStorage.setItem(
          "archlucid_last_registration",
          JSON.stringify({
            ...(body as TenantProvisioningResult),
            adminEmail: values.adminEmail,
            organizationName: values.organizationName,
          }),
        );
      } catch {
        /* ignore */
      }

      recordFirstTenantFunnelEvent("signup");
      showSuccess("Organization created — check your email if verification is required.");
      router.push(`/signup/verify?email=${encodeURIComponent(values.adminEmail)}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Request failed.";
      showError("Signup", message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <FormProvider {...form}>
      <section className={cn(MARKETING_SURFACES.cardComfort, "shadow-sm")} aria-labelledby="signup-form-heading">
        <h2 id="signup-form-heading" className="sr-only">
          Evaluation signup
        </h2>
        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <div>
            <Label htmlFor="signup-email" className={OPERATOR_TYPOGRAPHY.body}>
              Work email
            </Label>
            <Input id="signup-email" type="email" autoComplete="email" {...register("adminEmail")} className="mt-1.5 h-10" />
            {formState.errors.adminEmail ? (
              <p className={cn("mt-1 text-red-600", OPERATOR_TYPOGRAPHY.body)} role="alert">
                {formState.errors.adminEmail.message}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="signup-name" className={OPERATOR_TYPOGRAPHY.body}>
              Full name
            </Label>
            <Input id="signup-name" autoComplete="name" {...register("adminDisplayName")} className="mt-1.5 h-10" />
            {formState.errors.adminDisplayName ? (
              <p className={cn("mt-1 text-red-600", OPERATOR_TYPOGRAPHY.body)} role="alert">
                {formState.errors.adminDisplayName.message}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="signup-org" className={OPERATOR_TYPOGRAPHY.body}>
              Organization name
            </Label>
            <Input id="signup-org" autoComplete="organization" {...register("organizationName")} className="mt-1.5 h-10" />
            {formState.errors.organizationName ? (
              <p className={cn("mt-1 text-red-600", OPERATOR_TYPOGRAPHY.body)} role="alert">
                {formState.errors.organizationName.message}
              </p>
            ) : null}
          </div>

          <details
            className="rounded-md border border-neutral-200/90 bg-neutral-100/80 dark:border-neutral-700 dark:bg-neutral-900/50"
            data-testid="signup-optional-details"
          >
            <summary
              className={cn(
                "cursor-pointer select-none px-4 py-3 font-medium text-al-text-primary [&::-webkit-details-marker]:hidden",
                OPERATOR_TYPOGRAPHY.cardTitle,
              )}
            >
              Tell us a little more
            </summary>
            <div className="space-y-4 border-t border-neutral-200/90 px-4 py-4 dark:border-neutral-700">
              <div>
                <Label htmlFor="signup-size" className={optionalFieldLabelClass}>
                  Company size <span className="text-neutral-500 dark:text-neutral-400">(optional)</span>
                </Label>
                <Select
                  value={companySize ?? "__none__"}
                  onValueChange={(v) => {
                    setValue("companySize", v === "__none__" ? undefined : (v as SignupFormValues["companySize"]), {
                      shouldValidate: true,
                    });
                  }}
                >
                  <SelectTrigger id="signup-size" className="mt-1.5 h-10">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Prefer not to say</SelectItem>
                    {companySizeOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt} employees
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="signup-team-size" className={optionalFieldLabelClass}>
                  Architecture team size <span className="text-neutral-500 dark:text-neutral-400">(optional)</span>
                </Label>
                <Input
                  id="signup-team-size"
                  type="number"
                  min={1}
                  max={10_000}
                  data-testid="signup-architecture-team-size"
                  {...register("architectureTeamSize")}
                  className="mt-1.5 h-10"
                />
                {formState.errors.architectureTeamSize ? (
                  <p className={cn("mt-1 text-red-600", OPERATOR_TYPOGRAPHY.body)} role="alert">
                    {formState.errors.architectureTeamSize.message}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="signup-industry" className={optionalFieldLabelClass}>
                  Industry <span className="text-neutral-500 dark:text-neutral-400">(optional)</span>
                </Label>
                <Select
                  value={industryVertical ?? "__ind_none__"}
                  onValueChange={(v) => {
                    setValue(
                      "industryVertical",
                      v === "__ind_none__" ? undefined : (v as SignupFormValues["industryVertical"]),
                      { shouldValidate: true },
                    );
                  }}
                >
                  <SelectTrigger id="signup-industry" className="mt-1.5 h-10" data-testid="signup-industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ind_none__">Prefer not to say</SelectItem>
                    {industryVerticalOptions.map((opt) => (
                      <SelectItem key={opt} value={opt} data-testid={`signup-industry-${opt}`}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {industryVertical === "Other" ? (
                <div>
                  <Label htmlFor="signup-industry-specify" className={optionalFieldLabelClass}>
                    Industry (specify)
                  </Label>
                  <Input
                    id="signup-industry-specify"
                    data-testid="signup-industry-specify"
                    {...register("industryVerticalOther")}
                    className="mt-1.5 h-10"
                  />
                  {formState.errors.industryVerticalOther ? (
                    <p className={cn("mt-1 text-red-600", OPERATOR_TYPOGRAPHY.body)} role="alert">
                      {formState.errors.industryVerticalOther.message}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </details>

          <div className="space-y-3 pt-1">
            <Button
              type="submit"
              disabled={submitting || !canSubmit}
              aria-describedby={!canSubmit && !submitting ? "signup-form-readiness" : undefined}
              variant="primary"
              className="w-full sm:w-auto"
            >
              {submitting ? "Creating…" : "Create evaluation workspace"}
            </Button>
            <WhyDisabledCtaHint
              id="signup-form-readiness"
              testId="signup-form-readiness"
              reason={
                !canSubmit && !submitting
                  ? whyDisabledIncompleteInput(
                      "Enter work email, full name, and organization to continue.",
                    )
                  : null
              }
            />
            <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              You can inspect the sample review before adding your own evidence.
            </p>
            <p>
              <Link href="/pricing" className={cn(MARKETING_SURFACES.inlineLink, OPERATOR_TYPOGRAPHY.helper)}>
                Return to pricing
              </Link>
            </p>
          </div>

          <p className={cn("border-t border-neutral-200 pt-4 text-al-text-secondary dark:border-neutral-700", OPERATOR_TYPOGRAPHY.helper)}>
            We use this information to create your evaluation workspace and prevent abuse. We do not show tenant-identifying
            data in sample or aggregate views. See our{" "}
            <Link className="font-medium text-[var(--al-accent-link)] underline underline-offset-2 hover:text-[var(--al-accent-link-hover)]" href="/privacy">
              privacy policy
            </Link>{" "}
            and{" "}
            <Link
              className="font-medium text-[var(--al-accent-link)] underline underline-offset-2 hover:text-[var(--al-accent-link-hover)]"
              href="/security-trust"
            >
              assurance status
            </Link>
            . To protect the demo environment, evaluation workspaces may have usage limits.
          </p>
        </form>
      </section>
    </FormProvider>
  );
}
