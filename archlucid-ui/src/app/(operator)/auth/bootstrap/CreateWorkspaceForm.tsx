"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CREATE_WORKSPACE_DATA_REGION_OPTIONS } from "@/lib/auth/create-workspace-data-regions";
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
      dataRegion: "default",
      industryVertical: undefined,
      industryVerticalOther: "",
      termsAccepted: false,
      includeDemoSeed: false,
    },
    mode: "onBlur",
  });

  const { register, handleSubmit, watch, control, formState } = form;
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
          <Input
            id="workspaceName"
            className="mt-2"
            autoComplete="organization"
            disabled={pending}
            data-testid="create-workspace-name"
            {...register("workspaceName")}
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
          <Input
            id="organizationName"
            className="mt-2"
            disabled={pending}
            data-testid="create-workspace-organization-name"
            {...register("organizationName")}
          />
        </div>
        <div>
          <label className={cn("block", OPERATOR_TYPOGRAPHY.label)} htmlFor="dataRegion">
            {CREATE_WORKSPACE_COPY.dataRegionLabel}
          </label>
          <p className="mt-1 text-sm text-al-text-secondary">{CREATE_WORKSPACE_COPY.dataRegionHint}</p>
          <Controller
            control={control}
            name="dataRegion"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={pending}
              >
                <SelectTrigger
                  id="dataRegion"
                  className="mt-2"
                  aria-label={CREATE_WORKSPACE_COPY.dataRegionLabel}
                  data-testid="create-workspace-data-region"
                >
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  {CREATE_WORKSPACE_DATA_REGION_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      data-testid={`create-workspace-data-region-${option.value}`}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <label className={cn("block", OPERATOR_TYPOGRAPHY.label)} htmlFor="industryVertical">
            {CREATE_WORKSPACE_COPY.industryLabel}
          </label>
          <Controller
            control={control}
            name="industryVertical"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={pending}
              >
                <SelectTrigger
                  id="industryVertical"
                  className="mt-2"
                  aria-label={CREATE_WORKSPACE_COPY.industryLabel}
                  data-testid="create-workspace-industry"
                >
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {industryVerticalOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {industryVertical === "Other" ? (
          <div>
            <label className={cn("block", OPERATOR_TYPOGRAPHY.label)} htmlFor="industryVerticalOther">
              Industry (other)
            </label>
            <Input
              id="industryVerticalOther"
              className="mt-2"
              disabled={pending}
              data-testid="create-workspace-industry-other"
              {...register("industryVerticalOther")}
            />
          </div>
        ) : null}
        <div className="flex items-start gap-2">
          <Controller
            control={control}
            name="termsAccepted"
            render={({ field }) => (
              <Checkbox
                id="create-workspace-terms"
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true);
                }}
                disabled={pending}
                data-testid="create-workspace-terms"
              />
            )}
          />
          <label className={cn("text-sm text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} htmlFor="create-workspace-terms">
            {CREATE_WORKSPACE_COPY.termsLabel}{" "}
            <Link className={OPERATOR_LINK.nav} href="/trust">
              Trust center
            </Link>
          </label>
        </div>
        {formState.errors.termsAccepted ? (
          <p role="alert" className="text-sm text-red-700">
            {formState.errors.termsAccepted.message}
          </p>
        ) : null}
        <div className="flex items-start gap-2">
          <Controller
            control={control}
            name="includeDemoSeed"
            render={({ field }) => (
              <Checkbox
                id="create-workspace-demo-seed"
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true);
                }}
                disabled={pending}
                data-testid="create-workspace-demo-seed"
              />
            )}
          />
          <label
            className={cn("text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            htmlFor="create-workspace-demo-seed"
          >
            {CREATE_WORKSPACE_COPY.includeDemoSeedLabel}
          </label>
        </div>
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
