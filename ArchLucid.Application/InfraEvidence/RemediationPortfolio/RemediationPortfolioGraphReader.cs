using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

/// <summary>
/// Read-only adapter at an already authorized project/snapshot boundary. A trusted review custodian
/// supplies the expected proposal digest. This is not a caller-facing authorization or execution API.
/// </summary>
public sealed class RemediationPortfolioGraphReader(
    IAzureInventorySnapshotRepository snapshots,
    IProjectScopedOperationalSecurityFindingRepository findings,
    ISecurityEvidencePathRepository paths,
    ISecurityEvidenceCutPointRepository cutPoints,
    IRemediationPatternMatchRepository matches,
    IRemediationPatternRepository patterns)
{
    private const int MaxEvidenceIds = 1024;

    public async Task<RemediationPortfolioGraph> ReadAsync(ProjectSnapshotScopeKey authorizedScope,
        RemediationPortfolioProposal proposal, string reviewedProposalSha256, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(authorizedScope);
        cancellationToken.ThrowIfCancellationRequested();
        var review = RemediationPortfolioGraphBuilder.FreezeReviewed(authorizedScope, proposal, reviewedProposalSha256);
        ProjectScopeKey project = authorizedScope.Project;
        var context = new ScopeContext
        {
            TenantId = project.TenantId,
            WorkspaceId = project.WorkspaceId,
            ProjectId = project.ProjectId,
        };

        var evidence = review.Actions.SelectMany(row => row.Evidence).Concat(review.Causes.SelectMany(row => row.Evidence))
            .Concat(review.Scenarios.SelectMany(row => row.Evidence)).Concat(review.Relationships.SelectMany(row => row.Evidence))
            .Concat(review.Coverage.SelectMany(row => row.Evidence)).Select(row => (row.Kind, row.RecordId)).Distinct().ToArray();
        if (evidence.Length > MaxEvidenceIds)
            throw new ArgumentException("Reviewed evidence inventory exceeds the read bound.", nameof(proposal));
        var referenced = evidence.ToLookup(row => row.Kind, row => row.RecordId);
        var actionFindings = review.Actions.SelectMany(row => row.FindingIds).ToHashSet();
        var findingIds = actionFindings.Concat(review.Causes.SelectMany(row => row.FindingIds))
            .Concat(review.Scenarios.SelectMany(row => row.FindingIds)).Concat(referenced[PortfolioEvidenceKind.Finding]).Distinct().ToArray();
        if (findingIds.Length > MaxEvidenceIds)
            throw new ArgumentException("Reviewed finding inventory exceeds the read bound.", nameof(proposal));

        AzureInventorySnapshotRecord? capture = await snapshots.TryGetBySnapshotIdAsync(
            context, authorizedScope.SnapshotId, cancellationToken);
        if (capture is null || capture.SnapshotId != authorizedScope.SnapshotId
            || !project.Matches(capture.TenantId, capture.WorkspaceId, capture.ProjectId)
            || capture.ContentHashSha256 is not { Length: 32 }
            || !string.Equals(Convert.ToHexString(capture.ContentHashSha256), review.Binding.InventorySha256, StringComparison.Ordinal))
            throw new InvalidOperationException("The scoped snapshot is unavailable or no longer matches the reviewed evidence.");
        bool complete = capture is { CaptureStatus: AzureInventoryCaptureStatus.Succeeded, CapturedUtc: not null,
            WarningCount: 0, ErrorCount: 0, CompletenessScore: 1m };

        IReadOnlyList<OperationalSecurityFindingRecord> findingRows = findingIds.Length == 0
            ? [] : await findings.ListByIdsInScopeAsync(project, findingIds, cancellationToken);
        if (findingRows.Any(row => !project.Matches(row.TenantId, row.WorkspaceId, row.ProjectId))
            || findingRows.Any(row => !findingIds.Contains(row.FindingId)))
            throw new InvalidOperationException("Finding repository returned data outside the requested scope.");

        Guid[] pathIds = referenced[PortfolioEvidenceKind.Path].Distinct().ToArray();
        IReadOnlyList<SecurityEvidencePathRecord> pathRows = pathIds.Length == 0
            ? [] : await paths.ListByIdsInScopeAsync(project, pathIds, cancellationToken);
        if (pathRows.Any(row => !project.Matches(row.TenantId, row.WorkspaceId, row.ProjectId)
                                || !pathIds.Contains(row.PathId)))
            throw new InvalidOperationException("Path repository returned data outside the requested scope.");
        // A pinned path in another snapshot is stale evidence, never proof that no path exists.
        pathRows = pathRows.Where(row => row.SnapshotId == authorizedScope.SnapshotId
            && row.CanonicalHopHashSha256 is { Length: 32 }).ToArray();

        var cutIds = referenced[PortfolioEvidenceKind.CutPoint].ToHashSet();
        IReadOnlyList<SecurityEvidenceCutPointRecord> cutRows = cutIds.Count == 0
            ? [] : await cutPoints.ListBySnapshotAsync(authorizedScope, cancellationToken);
        if (cutRows.Any(row => row.TenantId != project.TenantId || row.SnapshotId != authorizedScope.SnapshotId))
            throw new InvalidOperationException("Cut-point repository returned data outside the requested snapshot.");
        cutRows = cutRows.Where(row => cutIds.Contains(row.CutPointId)).ToArray();

        Dictionary<Guid, RemediationPatternVersionRecord> approved = [];
        foreach (Guid item in review.Actions.Select(row => row.PatternId).Distinct().Order())
        {
            var current = await patterns.TryGetCurrentApprovedVersionAsync(project.TenantId, item, cancellationToken);
            if (current is null)
                continue;
            if (current.Pattern.TenantId != project.TenantId || current.Version.TenantId != project.TenantId
                || current.Pattern.PatternId != item || current.Version.PatternId != item)
                throw new InvalidOperationException("Pattern repository returned data outside the requested tenant or identity.");
            if (current.Version.Status == RemediationPatternStatus.Approved && current.Version.VersionId != Guid.Empty
                && string.Equals(current.Pattern.CurrentApprovedVersion, current.Version.Version, StringComparison.Ordinal))
                approved.Add(item, current.Version);
        }

        Dictionary<Guid, RemediationPatternMatchResultRecord> active = [];
        foreach (Guid id in findingRows.Where(row => actionFindings.Contains(row.FindingId))
                     .Select(row => row.FindingId).Distinct().Order())
        {
            RemediationPatternMatchResultRecord? item = await matches.TryGetActiveMatchInScopeAsync(project, id, cancellationToken);
            if (item is null)
                continue;
            if (item.TenantId != project.TenantId || item.FindingId != id)
                throw new InvalidOperationException("Pattern match repository returned data outside the requested finding scope.");
            if (item.IsActive && item.MatchResultId != Guid.Empty
                && approved.TryGetValue(item.PatternId, out var version) && item.VersionId == version.VersionId
                && string.Equals(item.PatternVersion, version.Version, StringComparison.Ordinal))
                active.Add(id, item);
        }

        cancellationToken.ThrowIfCancellationRequested();
        return RemediationPortfolioGraphBuilder.Build(review, complete, findingRows, pathRows, cutRows, approved, active);
    }
}
