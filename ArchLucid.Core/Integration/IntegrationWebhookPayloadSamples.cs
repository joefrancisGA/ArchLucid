using System.Text.Json;

namespace ArchLucid.Core.Integration;

/// <summary>Synthetic integration-event payloads for operator webhook simulation and bridge testing.</summary>
public static class IntegrationWebhookPayloadSamples
{
    private static readonly HashSet<string> KnownEventTypes = new(StringComparer.Ordinal)
    {
        IntegrationEventTypes.AuthorityRunCompletedV1,
        IntegrationEventTypes.DataConsistencyCheckCompletedV1,
        IntegrationEventTypes.ManifestFinalizedV1,
        IntegrationEventTypes.GovernanceApprovalSubmittedV1,
        IntegrationEventTypes.GovernancePromotionActivatedV1,
        IntegrationEventTypes.AlertFiredV1,
        IntegrationEventTypes.AlertResolvedV1,
        IntegrationEventTypes.AdvisoryScanCompletedV1,
        IntegrationEventTypes.ComplianceDriftEscalatedV1,
        IntegrationEventTypes.SeatReservationReleasedV1,
        IntegrationEventTypes.TrialLifecycleEmailV1,
        IntegrationEventTypes.BillingMarketplaceWebhookReceivedV1,
    };

    public static string ResolveEventType(string eventTypeAlias)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(eventTypeAlias);

        string normalized = eventTypeAlias.Trim();

        return normalized switch
        {
            "RunCommitted" or "ManifestFinalized" or "manifest-finalized" =>
                IntegrationEventTypes.ManifestFinalizedV1,
            "RunCompleted" or "AuthorityRunCompleted" or "authority-run-completed" =>
                IntegrationEventTypes.AuthorityRunCompletedV1,
            "GovernanceApprovalSubmitted" or "governance-approval-submitted" =>
                IntegrationEventTypes.GovernanceApprovalSubmittedV1,
            "GovernancePromotionActivated" or "governance-promotion-activated" =>
                IntegrationEventTypes.GovernancePromotionActivatedV1,
            "AlertFired" or "alert-fired" => IntegrationEventTypes.AlertFiredV1,
            "AlertResolved" or "alert-resolved" => IntegrationEventTypes.AlertResolvedV1,
            "AdvisoryScanCompleted" or "advisory-scan-completed" =>
                IntegrationEventTypes.AdvisoryScanCompletedV1,
            "ComplianceDriftEscalated" or "compliance-drift-escalated" =>
                IntegrationEventTypes.ComplianceDriftEscalatedV1,
            "DataConsistencyCheckCompleted" or "data-consistency-check-completed" =>
                IntegrationEventTypes.DataConsistencyCheckCompletedV1,
            _ when KnownEventTypes.Contains(normalized) => normalized,
            _ => throw new ArgumentException(
                $"Unknown event type alias '{eventTypeAlias}'. "
                + "Try RunCommitted, RunCompleted, ManifestFinalized, or a com.archlucid.* constant.",
                nameof(eventTypeAlias))
        };
    }

    public static byte[] CreatePayloadUtf8(string resolvedEventType)
    {
        object payload = CreatePayload(resolvedEventType);

        return JsonSerializer.SerializeToUtf8Bytes(payload, IntegrationEventJson.Options);
    }

    public static object CreatePayload(string resolvedEventType)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resolvedEventType);

        return resolvedEventType switch
        {
            IntegrationEventTypes.AuthorityRunCompletedV1 => CreateAuthorityRunCompleted(),
            IntegrationEventTypes.ManifestFinalizedV1 => CreateManifestFinalized(),
            IntegrationEventTypes.GovernanceApprovalSubmittedV1 => CreateGovernanceApprovalSubmitted(),
            IntegrationEventTypes.GovernancePromotionActivatedV1 => CreateGovernancePromotionActivated(),
            IntegrationEventTypes.AlertFiredV1 => CreateAlertFired(),
            IntegrationEventTypes.AlertResolvedV1 => CreateAlertResolved(),
            IntegrationEventTypes.AdvisoryScanCompletedV1 => CreateAdvisoryScanCompleted(),
            IntegrationEventTypes.ComplianceDriftEscalatedV1 => CreateComplianceDriftEscalated(),
            IntegrationEventTypes.DataConsistencyCheckCompletedV1 => CreateDataConsistencyCheckCompleted(),
            _ => throw new ArgumentException(
                $"No synthetic payload is wired for event type '{resolvedEventType}'.",
                nameof(resolvedEventType))
        };
    }

    private static object CreateAuthorityRunCompleted()
    {
        Guid runId = Guid.NewGuid();

        return new
        {
            schemaVersion = 1,
            runId,
            manifestId = Guid.NewGuid(),
            tenantId = Guid.NewGuid(),
            workspaceId = Guid.NewGuid(),
            projectId = Guid.NewGuid(),
            previousRunId = (Guid?)Guid.NewGuid(),
            findings = new[]
            {
                new
                {
                    findingId = "finding-primary",
                    deepLinkUrl = $"https://archlucid.net/runs/{runId:D}/findings/finding-primary",
                    severity = "High"
                }
            }
        };
    }

    private static object CreateManifestFinalized()
    {
        return new
        {
            schemaVersion = 1,
            runId = Guid.NewGuid(),
            manifestId = Guid.NewGuid(),
            decisionTraceId = Guid.NewGuid(),
            tenantId = Guid.NewGuid(),
            workspaceId = Guid.NewGuid(),
            projectId = Guid.NewGuid(),
            findingsSnapshotId = Guid.NewGuid(),
            artifactBundleId = (Guid?)Guid.NewGuid(),
            manifestVersion = "v1"
        };
    }

    private static object CreateGovernanceApprovalSubmitted()
    {
        return new
        {
            schemaVersion = 1,
            approvalRequestId = Guid.NewGuid().ToString("D"),
            runId = Guid.NewGuid(),
            tenantId = Guid.NewGuid(),
            workspaceId = Guid.NewGuid(),
            projectId = Guid.NewGuid(),
            submittedBy = "cli-simulator@archlucid.local"
        };
    }

    private static object CreateGovernancePromotionActivated()
    {
        return new
        {
            schemaVersion = 1,
            promotionRecordId = Guid.NewGuid().ToString("D"),
            runId = Guid.NewGuid(),
            tenantId = Guid.NewGuid(),
            workspaceId = Guid.NewGuid(),
            projectId = Guid.NewGuid(),
            targetEnvironment = "production"
        };
    }

    private static object CreateAlertFired()
    {
        return new
        {
            schemaVersion = 1,
            alertId = Guid.NewGuid().ToString("D"),
            tenantId = Guid.NewGuid(),
            severity = "Critical",
            title = "Synthetic alert fired (CLI simulate-webhook)"
        };
    }

    private static object CreateAlertResolved()
    {
        return new
        {
            schemaVersion = 1,
            alertId = Guid.NewGuid().ToString("D"),
            tenantId = Guid.NewGuid(),
            resolvedUtc = TimeProvider.System.GetUtcNow().ToString("O")
        };
    }

    private static object CreateAdvisoryScanCompleted()
    {
        return new
        {
            schemaVersion = 1,
            scanId = Guid.NewGuid(),
            tenantId = Guid.NewGuid(),
            findingsCount = 3
        };
    }

    private static object CreateComplianceDriftEscalated()
    {
        return new
        {
            schemaVersion = 1,
            tenantId = Guid.NewGuid(),
            openFindingsCount = 12,
            threshold = 10,
            escalatedUtc = TimeProvider.System.GetUtcNow().ToString("O")
        };
    }

    private static object CreateDataConsistencyCheckCompleted()
    {
        return new
        {
            schemaVersion = 1,
            checkId = Guid.NewGuid(),
            orphanGoldenManifestCount = 0,
            orphanFindingsSnapshotCount = 0,
            completedUtc = TimeProvider.System.GetUtcNow().ToString("O")
        };
    }
}
