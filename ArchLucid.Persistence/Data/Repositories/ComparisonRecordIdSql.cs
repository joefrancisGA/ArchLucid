namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>SQL expressions for legacy-tolerant <see cref="ArchLucid.Contracts.Metadata.ComparisonRecord.ComparisonRecordId"/> matching.</summary>
internal static class ComparisonRecordIdSql
{
    internal const string TrimmedColumnExpression = "LTRIM(RTRIM(ComparisonRecordId))";
}
