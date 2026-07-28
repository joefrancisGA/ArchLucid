namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Core <c>dbo.FindingsSnapshots</c> header columns for <see cref="IFindingsSnapshotRepository.GetByIdAsync" />.
///     Checklist / insight-density curation scalars (migration 256) are merged from <c>FindingsJson</c> instead.
/// </summary>
internal static class FindingsSnapshotReadSql
{
    public const string SelectHeaderColumns = """
                                              FindingsSnapshotId, RunId, ContextSnapshotId, GraphSnapshotId, CreatedUtc,
                                              SchemaVersion, GenerationStatus, FindingsJson
                                              """;
}
