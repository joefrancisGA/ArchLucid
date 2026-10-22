using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public interface ICloudResourceAuditLineageResolver
{
    Task<CloudResourceAuditLineageLink> ResolveAsync(
        ScopeContext scope,
        Guid cloudResourceId,
        CloudResourceEvidenceHubQuery query,
        CancellationToken cancellationToken = default);
}

public sealed class CloudResourceAuditLineageResolver(IAuditEvidenceSnapshotRepository snapshotRepository)
    : ICloudResourceAuditLineageResolver
{
    private const int MaxMatches = 25;

    public async Task<CloudResourceAuditLineageLink> ResolveAsync(
        ScopeContext scope,
        Guid cloudResourceId,
        CloudResourceEvidenceHubQuery query,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(query);

        if (TryBuildFromQuery(query, out CloudResourceAuditLineageLink? queryLink))
            return queryLink!;

        IReadOnlyList<AuditEvidenceSnapshotLineageContextRecord> contexts =
            await snapshotRepository.ListLineageContextsByCloudResourceIdAsync(
                scope.TenantId,
                cloudResourceId,
                MaxMatches,
                cancellationToken);

        if (contexts.Count == 0)
        {
            return new CloudResourceAuditLineageLink
            {
                Available = false,
                DegradedReason =
                    "No audit evidence snapshot rows reference this cloud resource yet. Collect audit evidence or open a control evaluation that includes this resource.",
            };
        }

        List<CloudResourceAuditLineageMatch> matches = DeduplicateMatches(contexts);

        if (matches.Count == 0)
        {
            return new CloudResourceAuditLineageLink
            {
                Available = false,
                DegradedReason =
                    "No audit evidence snapshot rows reference this cloud resource yet. Collect audit evidence or open a control evaluation that includes this resource.",
            };
        }

        CloudResourceAuditLineageMatch primary = matches[0];

        return new CloudResourceAuditLineageLink
        {
            Available = true,
            AssessmentId = primary.AssessmentId,
            AuditEvidenceSnapshotId = primary.AuditEvidenceSnapshotId,
            ControlId = primary.ControlId,
            ControlNumber = primary.ControlNumber,
            ControlTitle = primary.ControlTitle,
            RelativePath = BuildRelativePath(primary),
            Matches = matches,
        };
    }

    private static bool TryBuildFromQuery(CloudResourceEvidenceHubQuery query, out CloudResourceAuditLineageLink? link)
    {
        if (query.AssessmentId.HasValue
            && query.AuditEvidenceSnapshotId.HasValue
            && query.ControlId.HasValue
            && query.AssessmentId.Value != Guid.Empty
            && query.AuditEvidenceSnapshotId.Value != Guid.Empty
            && query.ControlId.Value != Guid.Empty)
        {
            CloudResourceAuditLineageMatch match = new()
            {
                AssessmentId = query.AssessmentId.Value,
                AuditEvidenceSnapshotId = query.AuditEvidenceSnapshotId.Value,
                ControlId = query.ControlId.Value,
            };

            link = new CloudResourceAuditLineageLink
            {
                Available = true,
                AssessmentId = match.AssessmentId,
                AuditEvidenceSnapshotId = match.AuditEvidenceSnapshotId,
                ControlId = match.ControlId,
                RelativePath = BuildRelativePath(match),
                Matches = [match],
            };

            return true;
        }

        link = null;
        return false;
    }

    private static List<CloudResourceAuditLineageMatch> DeduplicateMatches(
        IReadOnlyList<AuditEvidenceSnapshotLineageContextRecord> contexts)
    {
        Dictionary<(Guid AssessmentId, Guid ControlId), CloudResourceAuditLineageMatch> deduped = new();

        foreach (AuditEvidenceSnapshotLineageContextRecord context in contexts)
        {
            (Guid AssessmentId, Guid ControlId) key = (context.AssessmentId, context.ControlId);

            if (deduped.TryGetValue(key, out CloudResourceAuditLineageMatch? existing)
                && existing.SnapshotCreatedUtc >= context.SnapshotCreatedUtc)
            {
                continue;
            }

            deduped[key] = new CloudResourceAuditLineageMatch
            {
                AssessmentId = context.AssessmentId,
                AuditEvidenceSnapshotId = context.AuditEvidenceSnapshotId,
                ControlId = context.ControlId,
                ControlNumber = context.ControlNumber,
                ControlTitle = context.ControlTitle,
                SnapshotCreatedUtc = context.SnapshotCreatedUtc,
            };
        }

        return deduped.Values
            .OrderByDescending(match => match.SnapshotCreatedUtc)
            .ThenBy(match => match.ControlNumber, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string BuildRelativePath(CloudResourceAuditLineageMatch match) =>
        $"/v1/infra-evidence/audit-assessments/{match.AssessmentId:D}/snapshots/{match.AuditEvidenceSnapshotId:D}/controls/{match.ControlId:D}/lineage";
}
