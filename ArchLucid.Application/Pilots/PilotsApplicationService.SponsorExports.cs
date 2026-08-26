using System.Text.Json;

using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Pilots;

public sealed partial class PilotsApplicationService
{
    /// <inheritdoc />
    public Task<WhyArchLucidSnapshotResponse> GetWhyArchLucidSnapshotAsync(CancellationToken ct) =>
        _whyArchLucidSnapshotService.BuildAsync(ct);

    /// <inheritdoc />
    public Task<SponsorEvidencePackResponse> GetSponsorEvidencePackAsync(CancellationToken ct) =>
        _sponsorEvidencePackService.BuildAsync(ct);

    /// <inheritdoc />
    public Task<string?> TryBuildExecutiveReviewPacketMarkdownAsync(string runId, CancellationToken ct) =>
        _sponsorReviewPacketBuilder.BuildMarkdownAsync(runId, ct);

    /// <inheritdoc />
    public async Task<BuyerProofPackBuildResult?> TryBuildSponsorProofPackZipAsync(
        string runId,
        string baseForLinks,
        string correlationId,
        CancellationToken ct)
    {
        BuyerProofPackBuildResult? result =
            await _buyerProofPackBuilder.TryBuildZipAsync(runId, baseForLinks, ct);

        if (result is null)
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = _actorContext.GetActor();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.SponsorProofPackGenerated,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = correlationId,
                DataJson = JsonSerializer.Serialize(new { runId, demoDataWarning = result.DemoDataWarning }),
            },
            ct);

        return result;
    }

    /// <inheritdoc />
    public Task<string?> TryBuildFirstValueReportMarkdownAsync(
        string runId,
        string baseForLinks,
        CancellationToken ct) =>
        _firstValueReportBuilder.BuildMarkdownAsync(runId, baseForLinks, ct);

    /// <inheritdoc />
    public Task<byte[]?> TryBuildFirstValueReportPdfAsync(
        string runId,
        string baseForLinks,
        CancellationToken ct) =>
        _firstValueReportPdfBuilder.BuildPdfAsync(runId, baseForLinks, ct);

    /// <inheritdoc />
    public async Task<SponsorPackSentResult> RecordSponsorPackSentAsync(
        string runId,
        string? deliveryMethod,
        string? recipientEmail,
        string correlationId,
        CancellationToken ct)
    {
        ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(runId, ct);

        if (detail is null)
            return new SponsorPackSentResult(SponsorPackSentOutcome.RunNotFound);

        if (!detail.IsCommitted)
            return new SponsorPackSentResult(SponsorPackSentOutcome.NotCommitted);

        string normalizedDeliveryMethod = deliveryMethod?.Trim() ?? "email";

        if (normalizedDeliveryMethod.Length > 64)
            normalizedDeliveryMethod = normalizedDeliveryMethod[..64];

        string? normalizedRecipientEmail = recipientEmail?.Trim();

        if (normalizedRecipientEmail is not null && normalizedRecipientEmail.Length > 320)
            normalizedRecipientEmail = normalizedRecipientEmail[..320];

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = _actorContext.GetActor();
        string payload = JsonSerializer.Serialize(
            new
            {
                runId = detail.Run.RunId,
                recipientEmail = normalizedRecipientEmail,
                deliveryMethod = normalizedDeliveryMethod,
                recordedUtc = TimeProvider.System.GetUtcNow(),
            });

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.SponsorEvidencePackSent,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = correlationId,
                DataJson = payload,
            },
            ct);

        return new SponsorPackSentResult(SponsorPackSentOutcome.Recorded);
    }

    /// <inheritdoc />
    public async Task<SponsorPreliminaryShareResult> RecordSponsorPreliminaryShareAsync(
        string runId,
        string? readinessStatus,
        string[] knownGaps,
        bool? overrideAcknowledged,
        string? confidentialityLabel,
        string? deliveryMethod,
        string correlationId,
        CancellationToken ct)
    {
        ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(runId, ct);

        if (detail is null)
            return new SponsorPreliminaryShareResult(SponsorPreliminaryShareOutcome.RunNotFound);

        string normalizedReadinessStatus = readinessStatus?.Trim() ?? "unknown";

        if (normalizedReadinessStatus.Length > 64)
            normalizedReadinessStatus = normalizedReadinessStatus[..64];

        if (!string.Equals(normalizedReadinessStatus, "ready", StringComparison.OrdinalIgnoreCase)
            && overrideAcknowledged != true)
        {
            return new SponsorPreliminaryShareResult(SponsorPreliminaryShareOutcome.OverrideRequired);
        }

        string normalizedDeliveryMethod = deliveryMethod?.Trim() ?? "preliminary-draft";

        if (normalizedDeliveryMethod.Length > 64)
            normalizedDeliveryMethod = normalizedDeliveryMethod[..64];

        string? normalizedConfidentialityLabel = confidentialityLabel?.Trim();

        if (normalizedConfidentialityLabel is not null && normalizedConfidentialityLabel.Length > 256)
            normalizedConfidentialityLabel = normalizedConfidentialityLabel[..256];

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = _actorContext.GetActor();
        string payload = JsonSerializer.Serialize(
            new
            {
                runId = detail.Run.RunId,
                readinessStatus = normalizedReadinessStatus,
                knownGaps,
                overrideAcknowledged = overrideAcknowledged == true,
                confidentialityLabel = normalizedConfidentialityLabel,
                deliveryMethod = normalizedDeliveryMethod,
                isCommitted = detail.IsCommitted,
                recordedUtc = TimeProvider.System.GetUtcNow(),
            });

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.SponsorPreliminaryArchitectureShared,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = correlationId,
                DataJson = payload,
            },
            ct);

        return new SponsorPreliminaryShareResult(SponsorPreliminaryShareOutcome.Recorded);
    }

    /// <inheritdoc />
    public Task<byte[]?> TryBuildSponsorOnePagerPdfAsync(
        string runId,
        string baseForLinks,
        CancellationToken ct) =>
        _sponsorOnePagerPdfBuilder.BuildPdfAsync(runId, baseForLinks, ct);
}
