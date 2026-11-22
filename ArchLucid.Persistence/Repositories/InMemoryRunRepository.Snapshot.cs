using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class InMemoryRunRepository
{
    /// <summary>
    /// Materialize the same detached row boundary as SQL. RunRecord holds scalars and
    /// five mutable byte-array hash/version fields, which require deep copies.
    /// All 56 persisted/read fields are copied explicitly to make schema drift visible.
    /// </summary>
    private static RunRecord CopyRunRecord(RunRecord source)
    {
        // Commit and operator-disposition updates take this same row lock.
        // A read snapshot must not capture half of either multi-field change.
        lock (source)
        {
            return new RunRecord
            {
            TenantId = source.TenantId,
            WorkspaceId = source.WorkspaceId,
            ScopeProjectId = source.ScopeProjectId,
            RunId = source.RunId,
            ProjectId = source.ProjectId,
            Description = source.Description,
            CreatedUtc = source.CreatedUtc,
            CreatedByUserId = source.CreatedByUserId,
            ContextSnapshotId = source.ContextSnapshotId,
            GraphSnapshotId = source.GraphSnapshotId,
            FindingsSnapshotId = source.FindingsSnapshotId,
            GoldenManifestId = source.GoldenManifestId,
            DecisionTraceId = source.DecisionTraceId,
            ArtifactBundleId = source.ArtifactBundleId,
            ArchitectureId = source.ArchitectureId,
            ArchitectureVersionId = source.ArchitectureVersionId,
            PinnedArchitectureVersionContentHashSha256 = source.PinnedArchitectureVersionContentHashSha256?.ToArray(),
            KnowledgeModelId = source.KnowledgeModelId,
            PinnedKnowledgeModelContentHashSha256 = source.PinnedKnowledgeModelContentHashSha256?.ToArray(),
            ArchitectureRequestId = source.ArchitectureRequestId,
            LegacyRunStatus = source.LegacyRunStatus,
            CompletedUtc = source.CompletedUtc,
            CurrentManifestVersion = source.CurrentManifestVersion,
            OtelTraceId = source.OtelTraceId,
            IsDemoWelcomeRun = source.IsDemoWelcomeRun,
            IsPublicShowcase = source.IsPublicShowcase,
            IsSample = source.IsSample,
            IsPinned = source.IsPinned,
            ArchivedUtc = source.ArchivedUtc,
            RealModeFellBackToSimulator = source.RealModeFellBackToSimulator,
            StructuralExecutionMode = source.StructuralExecutionMode,
            WorkingCareerRehearsalDoor = source.WorkingCareerRehearsalDoor,
            ExecutePostureCapturedUtc = source.ExecutePostureCapturedUtc,
            PilotAoaiDeploymentSnapshot = source.PilotAoaiDeploymentSnapshot,
            EngineProvenanceJson = source.EngineProvenanceJson,
            GovernanceScopeJson = source.GovernanceScopeJson,
            AcknowledgedCoverageJson = source.AcknowledgedCoverageJson,
            AcknowledgedAssumptionsJson = source.AcknowledgedAssumptionsJson,
            ImproveLoopEvidenceJson = source.ImproveLoopEvidenceJson,
            RetryCount = source.RetryCount,
            LastFailureReason = source.LastFailureReason,
            RowVersion = source.RowVersion?.ToArray(),
            HasWarnings = source.HasWarnings,
            HasGovernanceWarnings = source.HasGovernanceWarnings,
            OperatorGovernanceDecision = source.OperatorGovernanceDecision,
            OperatorGovernanceDecisionRationale = source.OperatorGovernanceDecisionRationale,
            OperatorGovernanceDecisionUtc = source.OperatorGovernanceDecisionUtc,
            OperatorGovernanceDecisionByUserId = source.OperatorGovernanceDecisionByUserId,
            IsDeadLettered = source.IsDeadLettered,
            PackageOrigin = source.PackageOrigin,
            PinnedPolicyPackIdsJson = source.PinnedPolicyPackIdsJson,
            PinnedPolicyPackIdsHashSha256 = source.PinnedPolicyPackIdsHashSha256?.ToArray(),
            PinnedEvidencePackagePinsJson = source.PinnedEvidencePackagePinsJson,
            PinnedEvidencePackagePinsHashSha256 = source.PinnedEvidencePackagePinsHashSha256?.ToArray(),
            PinnedFocusedPilotModeEnabled = source.PinnedFocusedPilotModeEnabled,
            PinnedFocusedPilotCloudProvider = source.PinnedFocusedPilotCloudProvider,
            };
        }
    }
}
