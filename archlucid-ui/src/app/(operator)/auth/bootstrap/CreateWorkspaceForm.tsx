"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  CREATE_WORKSPACE_COPY,
  createWorkspaceFormSchema,
  type CreateWorkspaceFormValues,
} from "@/lib/auth/create-workspace-schema";
import { industryVerticalOptions } from "@/lib/signup-schema";
import { cn } from "@/lib/utils";

export type CreateWorkspaceFormProps = {
  readonly pending: boolean;
  readonly errorMessage: string | null;
  readonly showAccessRequest: boolean;
  readonly onSubmit: (values: CreateWorkspaceFormValues) => void;
  readonly onAccessRequest: () => void;
};

export function CreateWorkspaceForm({
  pending,
  errorMessage,
  showAccessRequest,
  onSubmit,
  onAccessRequest,
}: CreateWorkspaceFormProps) {
  const form = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceFormSchema),
    defaultValues: {
      workspaceName: "",
      organizationName: "",
      dataRegion: "",
      industryVertical: undefined,
      industryVerticalOther: "",
      termsAccepted: false,
      includeDemoSeed: false,
    },
    mode: "onBlur",
  });

  const { register, handleSubmit, watch, formState } = form;
  const industryVertical = watch("industryVertical");

  return (
    <div className="max-w-[560px]" data-testid="create-workspace-form">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{CREATE_WORKSPACE_COPY.title}</h1>
      <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{CREATE_WORKSPACE_COPY.lead}</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className={cn("block", OPERATOR_TYPOGRAPHY.label)} htmlFor="workspaceName">
            {CREATE_WORKSPACE_COPY.workspaceNameLabel}
          </label>
          <input
            id="workspaceName"
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base dark:border-neutral-600 dark:bg-neutral-900"
            autoComplete="organization"
            disabled={pending}
            {...register("workspaceName")}
            data-testid="create-workspace-name"
          />
          {formState.errors.workspaceName ? (
            <p role="alert" className="mt-1 text-sm text-red-700">
              {formState.errors.workspaceName.message}
            </p>
          ) : null}
        </div>
        <div>
          <label className={cn("block", OPERATOR_TYPOGRAPHY.label)} htmlFor="organizationName">
            {CREATE_WORKSPACE_COPY.organizationNameLabel}
          </label>
          <p className="mt-1 text-sm text-al-text-secondary">{CREATE_WORKSPACE_COPY.organizationHint}</p>
          <input
            id="organizationName"
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base dark:border-neutral-600 dark:bg-neutral-900"
            disabled={pending}
            {...register("organizationName")}
          />
        </div>
        <div>
          <label className={cn("block", OPERATOR_TYPOGRAPHY.label)} htmlFor="industryVertical">
            {CREATE_WORKSPACE_COPY.industryLabel}
          </label>
          <select
            id="industryVertical"
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base dark:border-neutral-600 dark:bg-neutral-900"
            disabled={pending}
            {...register("industryVertical")}
          >
            <option value="">Select…</option>
            {industryVerticalOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        {industryVertical === "Other" ? (
          <div>
            <label className={cn("block", OPERATOR_TYPOGRAPHY.label)} htmlFor="industryVerticalOther">
              Industry (other)
            </label>
            <input
              id="industryVerticalOther"
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base dark:border-neutral-600 dark:bg-neutral-900"
              disabled={pending}
              {...register("industryVerticalOther")}
            />
          </div>
        ) : null}
        <label className="flex items-start gap-2 text-sm text-al-text-primary">
          <input type="checkbox" disabled={pending} {...register("termsAccepted")} data-testid="create-workspace-terms" />
          <span>
            {CREATE_WORKSPACE_COPY.termsLabel}{" "}
            <Link className={OPERATOR_LINK.nav} href="/trust">
              Trust center
            </Link>
          </span>
        </label>
        {formState.errors.termsAccepted ? (
          <p role="alert" className="text-sm text-red-700">
            {formState.errors.termsAccepted.message}
          </p>
        ) : null}
        <label className="flex items-start gap-2 text-sm text-al-text-secondary">
          <input type="checkbox" disabled={pending} {...register("includeDemoSeed")} />
          <span>{CREATE_WORKSPACE_COPY.includeDemoSeedLabel}</span>
        </label>
        {errorMessage ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary" disabled={pending} data-testid="create-workspace-submit">
            {pending ? CREATE_WORKSPACE_COPY.submitting : CREATE_WORKSPACE_COPY.submit}
          </Button>
          {showAccessRequest ? (
            <Button type="button" variant="outline" onClick={onAccessRequest} data-testid="create-workspace-access-request">
              {CREATE_WORKSPACE_COPY.accessRequest}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
