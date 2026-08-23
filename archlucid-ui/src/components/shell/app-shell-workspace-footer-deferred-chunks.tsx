"use client";

import type { ComponentType } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import type { DeploymentBuildFingerprintStripProps } from "./DeploymentBuildFingerprintStrip";
import type { SystemHealthStatusStripProps } from "@/components/operator-home/SystemHealthStatusStrip";
import type { TrustCenterShellLinkProps } from "@/components/usability/TrustCenterShellLink";

export const TrustCenterShellLinkDeferred: ComponentType<TrustCenterShellLinkProps> =
  createDeferredComponentFromManifest("app-shell-footer-trust-center-shell-link", {
    suppressLoading: true,
  }) as ComponentType<TrustCenterShellLinkProps>;

export const SystemHealthStatusStripDeferred: ComponentType<SystemHealthStatusStripProps> =
  createDeferredComponentFromManifest("app-shell-footer-system-health-status-strip", {
    suppressLoading: true,
  }) as ComponentType<SystemHealthStatusStripProps>;

export const DeploymentBuildFingerprintStripDeferred: ComponentType<DeploymentBuildFingerprintStripProps> =
  createDeferredComponentFromManifest("app-shell-footer-deployment-build-fingerprint-strip", {
    suppressLoading: true,
  }) as ComponentType<DeploymentBuildFingerprintStripProps>;
