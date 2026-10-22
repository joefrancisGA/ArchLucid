using ArchLucid.Contracts.Governance.Coverage;

using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Data.Repositories;

internal static class CoverageAssignmentRepositoryCore
{
    public static CoverageAssignment Clone(CoverageAssignment source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new CoverageAssignment
        {
            CoverageAssignmentId = source.CoverageAssignmentId,
            TenantId = source.TenantId,
            WorkspaceId = source.WorkspaceId,
            ProjectId = source.ProjectId,
            RunId = source.RunId,
            PolicyPackId = source.PolicyPackId,
            PolicyPackVersion = source.PolicyPackVersion,
            CoverageType = source.CoverageType,
            SelectionState = source.SelectionState,
            RecommendationConfidence = source.RecommendationConfidence,
            RecommendationTrigger = source.RecommendationTrigger,
            RecommendationRationale = source.RecommendationRationale,
            TriggeringEvidenceRef = source.TriggeringEvidenceRef,
            ExclusionReason = source.ExclusionReason,
            ActorUserId = source.ActorUserId,
            CreatedUtc = source.CreatedUtc,
            EvaluationVersion = source.EvaluationVersion,
        };
    }

    public static CoverageAssignment ToAssignment(CoverageAssignmentRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        return new CoverageAssignment
        {
            CoverageAssignmentId = row.CoverageAssignmentId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            RunId = row.RunId is null ? null : SqlRunIdMapping.ToContractRunId(row.RunId.Value),
            PolicyPackId = row.PolicyPackId,
            PolicyPackVersion = row.PolicyPackVersion,
            CoverageType = Enum.Parse<CoverageType>(row.CoverageType),
            SelectionState = Enum.Parse<CoverageSelectionState>(row.SelectionState),
            RecommendationConfidence = row.RecommendationConfidence is null
                ? null
                : Enum.Parse<RecommendationConfidence>(row.RecommendationConfidence),
            RecommendationTrigger = row.RecommendationTrigger,
            RecommendationRationale = row.RecommendationRationale,
            TriggeringEvidenceRef = row.TriggeringEvidenceRef,
            ExclusionReason = row.ExclusionReason,
            ActorUserId = row.ActorUserId,
            CreatedUtc = row.CreatedUtc,
            EvaluationVersion = row.EvaluationVersion,
        };
    }

    public static IEnumerable<CoverageAssignment> FilterByRunId(
        IEnumerable<CoverageAssignment> rows,
        string runId)
    {
        ArgumentNullException.ThrowIfNull(rows);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return rows
            .Where(row => string.Equals(row.RunId, runId, StringComparison.Ordinal))
            .OrderBy(row => row.CreatedUtc);
    }

    public static IEnumerable<CoverageAssignment> FilterByScopeWithoutRun(
        IEnumerable<CoverageAssignment> rows,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        ArgumentNullException.ThrowIfNull(rows);

        return rows
            .Where(row => row.TenantId == tenantId
                          && row.WorkspaceId == workspaceId
                          && row.ProjectId == projectId
                          && row.RunId is null)
            .OrderBy(row => row.CreatedUtc);
    }

    public sealed class CoverageAssignmentRow
    {
        public Guid CoverageAssignmentId
        {
            get;
            set;
        }

        public Guid TenantId
        {
            get;
            set;
        }

        public Guid WorkspaceId
        {
            get;
            set;
        }

        public Guid ProjectId
        {
            get;
            set;
        }

        public Guid? RunId
        {
            get;
            set;
        }

        public Guid PolicyPackId
        {
            get;
            set;
        }

        public string PolicyPackVersion
        {
            get;
            set;
        } = string.Empty;

        public string CoverageType
        {
            get;
            set;
        } = string.Empty;

        public string SelectionState
        {
            get;
            set;
        } = string.Empty;

        public string? RecommendationConfidence
        {
            get;
            set;
        }

        public string? RecommendationTrigger
        {
            get;
            set;
        }

        public string? RecommendationRationale
        {
            get;
            set;
        }

        public string? TriggeringEvidenceRef
        {
            get;
            set;
        }

        public string? ExclusionReason
        {
            get;
            set;
        }

        public string ActorUserId
        {
            get;
            set;
        } = string.Empty;

        public DateTime CreatedUtc
        {
            get;
            set;
        }

        public string EvaluationVersion
        {
            get;
            set;
        } = string.Empty;
    }
}
