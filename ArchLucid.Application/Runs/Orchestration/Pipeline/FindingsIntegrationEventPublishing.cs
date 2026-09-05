using System.Data;

using ArchLucid.Application.Integration;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>Publishes batched high-severity findings integration events when a snapshot is sealed.</summary>
internal static class FindingsIntegrationEventPublishing
{
    internal static async Task TryPublishHighSeverityCapturedAsync(
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IIntegrationEventPublisher integrationEventPublisher,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
        ILogger logger,
        FindingsSnapshot findingsSnapshot,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        string publicBaseUrl,
        IDbConnection? connection,
        IDbTransaction? transaction,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(integrationEventOutbox);
        ArgumentNullException.ThrowIfNull(integrationEventPublisher);
        ArgumentNullException.ThrowIfNull(integrationEventsOptions);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(findingsSnapshot);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        List<Finding> highSeverityFindings = findingsSnapshot.Findings
            .Where(f => IsHighSeverity(f.Severity))
            .ToList();

        if (highSeverityFindings.Count == 0)
            return;

        string? manifestHash = await RunIntegrationEventManifestHashResolver.TryResolveVerifiedManifestHashAsync(
            findingsSnapshot.RunId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);

        string normalizedBaseUrl = NormalizePublicSiteBaseUrl(publicBaseUrl);
        object[] findingRows = BuildFindingRows(findingsSnapshot.RunId, highSeverityFindings, normalizedBaseUrl);

        object payload = new
        {
            schemaVersion = 1,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            runId = findingsSnapshot.RunId,
            findingsSnapshotId = findingsSnapshot.FindingsSnapshotId,
            highSeverityCount = highSeverityFindings.Count,
            manifestHash,
            findings = findingRows,
        };

        string messageId =
            $"{findingsSnapshot.RunId:D}:{findingsSnapshot.FindingsSnapshotId:D}:{IntegrationEventTypes.FindingsHighSeverityCapturedV1}";

        await OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            integrationEventOutbox,
            integrationEventPublisher,
            integrationEventsOptions.CurrentValue,
            logger,
            IntegrationEventTypes.FindingsHighSeverityCapturedV1,
            payload,
            messageId,
            findingsSnapshot.RunId,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            connection,
            transaction,
            cancellationToken);
    }

    private static bool IsHighSeverity(FindingSeverity severity) =>
        severity >= FindingSeverity.Error;

    private static object[] BuildFindingRows(Guid runId, IReadOnlyList<Finding> findings, string publicBaseUrl)
    {
        List<object> rows = [];

        foreach (Finding finding in findings)
        {
            if (string.IsNullOrWhiteSpace(finding.FindingId))
                continue;

            string findingId = finding.FindingId.Trim();
            string deepLinkUrl = $"{publicBaseUrl}/runs/{runId:D}/findings/{Uri.EscapeDataString(findingId)}";

            rows.Add(new
            {
                findingId,
                title = finding.Title,
                severity = finding.Severity.ToString(),
                category = finding.Category,
                deepLinkUrl,
            });
        }

        return [.. rows];
    }

    private static string NormalizePublicSiteBaseUrl(string? raw)
    {
        const string fallback = "https://archlucid.net";

        if (string.IsNullOrWhiteSpace(raw))
            return fallback;

        string trimmed = raw.Trim().TrimEnd('/');

        return trimmed.Length == 0 ? fallback : trimmed;
    }
}
