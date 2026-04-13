namespace ArchLucid.Core.Identity;

/// <summary>
/// Strongly-typed identifier for authority runs, wrapping a <see cref="Guid"/>.
/// Use this at boundaries to avoid confusing a run id with other <see cref="Guid"/> keys (tenant, workspace, snapshot).
/// </summary>
/// <remarks>
/// Full migration from raw <see cref="Guid"/> on run records and HTTP APIs is incremental; adopt this type module-by-module.
/// </remarks>
[System.Text.Json.Serialization.JsonConverter(typeof(RunIdJsonConverter))]
public readonly record struct RunId(Guid Value) : IComparable<RunId>
{
    public static RunId New() => new(Guid.NewGuid());

    public static RunId Empty => new(Guid.Empty);

    public static implicit operator Guid(RunId id) => id.Value;

    public static explicit operator RunId(Guid guid) => new(guid);

    public int CompareTo(RunId other) => Value.CompareTo(other.Value);

    public override string ToString() => Value.ToString("D");
}
