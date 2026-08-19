namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>One structural drift between an expected catalog shape and live SQL Server metadata.</summary>
public sealed class SchemaDriftMismatch
{
    public required string ObjectKind { get; init; }

    public required string ObjectName { get; init; }

    public required string Expected { get; init; }

    public required string Actual { get; init; }

    public override string ToString()
    {
        return $"{ObjectKind} '{ObjectName}': expected {Expected}; actual {Actual}.";
    }
}
