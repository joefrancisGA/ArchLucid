using ArchLucid.Api.Http;
using ArchLucid.Api.Models.CustomerSuccess;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

public sealed partial class TenantCustomerSuccessController
{
    /// <summary>
    ///     Queryable pilot funnel milestones derived from durable SQL (runs, manifests, audit, product-learning) —
    ///     no PII payload.
    /// </summary>
    [HttpGet("funnel-snapshot")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(PilotFunnelSnapshotResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFunnelSnapshotAsync(CancellationToken cancellationToken)
    {
        (IActionResult? scopeProblem, ScopeContext scope) = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            this,
            _scopeProvider,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);

        if (scopeProblem is not null)
            return scopeProblem;

        PilotFunnelSnapshot snap = await _stickinessSnapshotReader
            .GetFunnelSnapshotAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        return Ok(
            new PilotFunnelSnapshotResponse
            {
                FirstRunCreatedUtc = ToOffset(snap.FirstRunCreatedUtc),
                FirstGoldenManifestUtc = ToOffset(snap.FirstGoldenManifestUtc),
                FirstComparisonUtc = ToOffset(snap.FirstComparisonUtc),
                FirstArtifactOrBundleDownloadUtc = ToOffset(snap.FirstArtifactOrBundleDownloadUtc),
                FirstReplayUtc = ToOffset(snap.FirstReplayUtc),
                TotalRunsInScope = snap.TotalRunsInScope,
                CommittedRunsInScope = snap.CommittedRunsInScope,
                ProductLearningSignalsLast90Days = snap.ProductLearningSignalsLast90Days
            });
    }

    /// <summary>Pilot funnel milestones plus comparison and governance habit signals for customer-success views.</summary>
    [HttpGet("stickiness-snapshot")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(OperatorStickinessSnapshotResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStickinessSnapshotAsync(CancellationToken cancellationToken)
    {
        (IActionResult? scopeProblem, ScopeContext scope) = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            this,
            _scopeProvider,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);

        if (scopeProblem is not null)
            return scopeProblem;

        PilotFunnelSnapshot funnel = await _stickinessSnapshotReader
            .GetFunnelSnapshotAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        OperatorStickinessSignals signals = await _stickinessSnapshotReader
            .GetOperatorSignalsAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        OperatorStickinessSnapshotResponse body = new()
        {
            PilotFunnel = new PilotFunnelSnapshotResponse
            {
                FirstRunCreatedUtc = ToOffset(funnel.FirstRunCreatedUtc),
                FirstGoldenManifestUtc = ToOffset(funnel.FirstGoldenManifestUtc),
                FirstComparisonUtc = ToOffset(funnel.FirstComparisonUtc),
                FirstArtifactOrBundleDownloadUtc = ToOffset(funnel.FirstArtifactOrBundleDownloadUtc),
                FirstReplayUtc = ToOffset(funnel.FirstReplayUtc),
                TotalRunsInScope = funnel.TotalRunsInScope,
                CommittedRunsInScope = funnel.CommittedRunsInScope,
                ProductLearningSignalsLast90Days = funnel.ProductLearningSignalsLast90Days,
            },
            LatestRunId = signals.LatestRunId,
            ComparisonEventsLast30Days = signals.ComparisonAuditEvents30D,
            PendingGovernanceApprovals = signals.PendingGovernanceApprovals,
        };

        return Ok(body);
    }

    private static DateTimeOffset? ToOffset(DateTime? utc)
    {
        if (utc is null)
            return null;

        return new DateTimeOffset(DateTime.SpecifyKind(utc.Value, DateTimeKind.Utc), TimeSpan.Zero);
    }
}
