namespace ArchLucid.Persistence.Sql;

/// <summary>Scoped UPDATE for demo-seed repair of hasher-bound receipt fields (release-gate SQL catalog backfill).</summary>
internal static class GoldenManifestDemoRepairSql
{
    internal const string UpdateHasherBoundAndManifestHash = """
        UPDATE dbo.GoldenManifests
        SET ManifestHash = @ManifestHash,
            HasherBoundJson = @HasherBoundJson
        WHERE TenantId = @TenantId
          AND WorkspaceId = @WorkspaceId
          AND ProjectId = @ProjectId
          AND ManifestId = @ManifestId;
        """;
}
