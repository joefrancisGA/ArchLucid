using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.Repositories;

public static partial class DecisionTraceRepositoryCore
{
    public const string SelectColumns = """
        TenantId, WorkspaceId, ProjectId,
        DecisionTraceId, RunId, CreatedUtc,
        RuleSetId, RuleSetVersion, RuleSetHash,
        AppliedRuleIdsJson, AcceptedFindingIdsJson, RequiredFindingIdsJson,
        AllowedFindingIdsJson, PreferredFindingIdsJson, RejectedFindingIdsJson, NotesJson,
        ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, PromptRefsJson, WarningsJson
        """;

    public const string InsertSql = """
        INSERT INTO dbo.DecisioningTraces
        (
            TenantId, WorkspaceId, ProjectId,
            DecisionTraceId, RunId, CreatedUtc,
            RuleSetId, RuleSetVersion, RuleSetHash,
            AppliedRuleIdsJson, AcceptedFindingIdsJson, RequiredFindingIdsJson,
            AllowedFindingIdsJson, PreferredFindingIdsJson, RejectedFindingIdsJson, NotesJson,
            ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, PromptRefsJson, WarningsJson
        )
        VALUES
        (
            @TenantId, @WorkspaceId, @ProjectId,
            @DecisionTraceId, @RunId, @CreatedUtc,
            @RuleSetId, @RuleSetVersion, @RuleSetHash,
            @AppliedRuleIdsJson, @AcceptedFindingIdsJson, @RequiredFindingIdsJson,
            @AllowedFindingIdsJson, @PreferredFindingIdsJson, @RejectedFindingIdsJson, @NotesJson,
            @ContextSnapshotId, @GraphSnapshotId, @FindingsSnapshotId, @PromptRefsJson, @WarningsJson
        );
        """;

    public static object CreateInsertArgs(RuleAuditTracePayload audit)
    {
        ArgumentNullException.ThrowIfNull(audit);

        return new
        {
            audit.TenantId,
            audit.WorkspaceId,
            audit.ProjectId,
            audit.DecisionTraceId,
            audit.RunId,
            audit.CreatedUtc,
            audit.RuleSetId,
            audit.RuleSetVersion,
            audit.RuleSetHash,
            AppliedRuleIdsJson = JsonEntitySerializer.Serialize(audit.AppliedRuleIds),
            AcceptedFindingIdsJson = JsonEntitySerializer.Serialize(audit.AcceptedFindingIds),
            RequiredFindingIdsJson = JsonEntitySerializer.Serialize(audit.RequiredFindingIds),
            AllowedFindingIdsJson = JsonEntitySerializer.Serialize(audit.AllowedFindingIds),
            PreferredFindingIdsJson = JsonEntitySerializer.Serialize(audit.PreferredFindingIds),
            RejectedFindingIdsJson = JsonEntitySerializer.Serialize(audit.RejectedFindingIds),
            NotesJson = JsonEntitySerializer.Serialize(audit.Notes),
            audit.ContextSnapshotId,
            audit.GraphSnapshotId,
            audit.FindingsSnapshotId,
            PromptRefsJson = JsonEntitySerializer.Serialize(audit.PromptRefs),
            WarningsJson = JsonEntitySerializer.Serialize(audit.Warnings),
        };
    }
}
