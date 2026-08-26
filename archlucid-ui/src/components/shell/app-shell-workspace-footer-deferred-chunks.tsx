"use client";

import type { ComponentProps, ComponentType } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import { DeploymentBuildFingerprintStrip } from "./DeploymentBuildFingerprintStrip";
import { SystemHealthStatusStrip } from "@/components/operator-home/SystemHealthStatusStrip";
import { TrustCenterShellLink } from "@/components/usability/TrustCenterShellLink";

type DeploymentBuildFingerprintStripProps = ComponentProps<typeof DeploymentBuildFingerprintStrip>;
type SystemHealthStatusStripProps = ComponentProps<typeof SystemHealthStatusStrip>;
type TrustCenterShellLinkProps = ComponentProps<typeof TrustCenterShellLink>;

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
