using ArchLucid.Application;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Governance;

public sealed partial class GovernanceDigestDecisionNeededComposer
{
    /// <summary>
    ///     Seals each run referenced by pending approvals that contribute to
    ///     <see cref="BuildSummaryAsync" /> pending-approval totals.
    /// </summary>
    public async Task EnsurePendingApprovalRunsSealedForSummaryAsync(
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        IReadOnlyList<GovernanceApprovalRequest> pending =
            await _approvalRepository.GetPendingAsync(DecisionsNeededPendingApprovalsPageSize, cancellationToken);

        HashSet<Guid> runIdsToSeal = [];

        foreach (GovernanceApprovalRequest approval in pending)
        {
            if (string.IsNullOrWhiteSpace(approval.RunId))
            {
                throw new ConflictException(
                    $"Decisions-needed summary blocked for approval '{approval.ApprovalRequestId}': pending approval has no run id.");
            }

            if (!Guid.TryParse(approval.RunId.Trim(), out Guid runId) || runId == Guid.Empty)
            {
                throw new ConflictException(
                    $"Decisions-needed summary blocked for approval '{approval.ApprovalRequestId}': pending approval run id is not attestable.");
            }

            if (!runIdsToSeal.Add(runId))
            {
                continue;
            }

            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runId,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }
    }

    /// <summary>
    ///     Seals authority runs for findings that contribute needs-evidence or deferred-due counts to
    ///     <see cref="BuildSummaryAsync" /> so summary reads do not attest unsealed runs omitted from the
    ///     risk-register page guard.
    /// </summary>
    public async Task EnsureOpenDispositionTrailRunsSealedForSummaryAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid? projectId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        IFindingInspectReadRepository findingInspectReadRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);
        ArgumentNullException.ThrowIfNull(findingInspectReadRepository);

        DateTimeOffset now = TimeProvider.System.UtcNowDateTime();
        DateTimeOffset since = now.Subtract(TimeSpan.FromDays(30));

        IReadOnlyList<FindingReviewEventRecord> recent = FilterTrailToScope(
            await _findingReviewTrailRepository.ListSinceUtcAsync(tenantId, since, cancellationToken),
            workspaceId,
            projectId);

        IReadOnlyList<FindingReviewEventRecord> openDispositionEvents =
            GovernanceDigestOpenDispositionSelector.SelectNeedsEvidence(recent)
                .Concat(GovernanceDigestOpenDispositionSelector.SelectDeferredDue(recent, now))
                .ToList();

        HashSet<Guid> runIdsToSeal = [];

        foreach (FindingReviewEventRecord reviewEvent in openDispositionEvents)
        {
            Guid runId = reviewEvent.RunId ?? Guid.Empty;

            if (runId == Guid.Empty)
            {
                if (string.IsNullOrWhiteSpace(reviewEvent.FindingId))
                {
                    continue;
                }

                FindingInspectResponse? finding = await findingInspectReadRepository.GetInspectAsync(
                    scope,
                    reviewEvent.FindingId.Trim(),
                    cancellationToken,
                    FindingInspectReadOptions.MetadataOnly);

                if (finding is null || finding.RunId == Guid.Empty)
                {
                    string findingLabel = string.IsNullOrWhiteSpace(reviewEvent.FindingId)
                        ? "(empty)"
                        : reviewEvent.FindingId.Trim();

                    throw new ConflictException(
                        $"Decisions-needed summary blocked for finding '{findingLabel}': open disposition trail has no run id and finding inspect did not resolve an attestable run.");
                }

                runId = finding.RunId;
            }

            if (!runIdsToSeal.Add(runId))
            {
                continue;
            }

            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runId,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }
    }
}
