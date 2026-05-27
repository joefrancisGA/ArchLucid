namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>Curated table/column/index expectations used by schema drift verification.</summary>
public sealed class SchemaSentinelExpectation
{
    public required string TableName { get; init; }

    public IReadOnlyList<SchemaSentinelColumn> Columns { get; init; } = [];

    public IReadOnlyList<string> IndexNames { get; init; } = [];
}

/// <summary>Expected column presence for drift checks (nullability/type parity is best-effort).</summary>
public sealed class SchemaSentinelColumn
{
    public required string ColumnName { get; init; }

    public string? SqlDataType { get; init; }
}
