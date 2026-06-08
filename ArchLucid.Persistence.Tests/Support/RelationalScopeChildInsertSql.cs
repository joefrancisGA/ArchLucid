namespace ArchLucid.Persistence.Tests.Support;

/// <summary>
///     Shared INSERT templates that copy tenant/workspace/project scope from parent authority rows (DbUp 129 parity).
/// </summary>
internal static class RelationalScopeChildInsertSql
{
    internal const string FindingRecordFromSnapshot = """
                                                        INSERT INTO dbo.FindingRecords
                                                        (
                                                            FindingRecordId, FindingsSnapshotId, TenantId, WorkspaceId, ProjectId, SortOrder,
                                                            FindingId, FindingSchemaVersion, FindingType, Category, EngineType,
                                                            Severity, Title, Rationale, PayloadType, PayloadJson
                                                        )
                                                        SELECT
                                                            @FindingRecordId, @FindingsSnapshotId, fs.TenantId, fs.WorkspaceId, fs.ProjectId, @SortOrder,
                                                            @FindingId, @FindingSchemaVersion, @FindingType, @Category, @EngineType,
                                                            @Severity, @Title, @Rationale, @PayloadType, @PayloadJson
                                                        FROM dbo.FindingsSnapshots fs
                                                        WHERE fs.FindingsSnapshotId = @FindingsSnapshotId;
                                                        """;

    internal const string GoldenManifestDecisionFromManifest = """
                                                                 INSERT INTO dbo.GoldenManifestDecisions
                                                                 (
                                                                     ManifestId, TenantId, WorkspaceId, ProjectId, SortOrder,
                                                                     DecisionId, Category, Title, SelectedOption, Rationale, RawDecisionJson
                                                                 )
                                                                 SELECT
                                                                     @ManifestId, m.TenantId, m.WorkspaceId, m.ProjectId, @SortOrder,
                                                                     @DecisionId, @Category, @Title, @SelectedOption, @Rationale, @RawDecisionJson
                                                                 FROM dbo.GoldenManifests m
                                                                 WHERE m.ManifestId = @ManifestId;
                                                                 """;

    internal const string GoldenManifestProvenanceSourceFindingFromManifest = """
                                                                                INSERT INTO dbo.GoldenManifestProvenanceSourceFindings
                                                                                (ManifestId, TenantId, WorkspaceId, ProjectId, SortOrder, FindingId)
                                                                                SELECT @ManifestId, m.TenantId, m.WorkspaceId, m.ProjectId, @SortOrder, @FindingId
                                                                                FROM dbo.GoldenManifests m
                                                                                WHERE m.ManifestId = @ManifestId;
                                                                                """;
}
