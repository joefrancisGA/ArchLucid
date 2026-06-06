namespace ArchLucid.Core.Scoping;

/// <summary>
///     A resolved scope id and the trustedness of its source (TB-304).
/// </summary>
public readonly record struct ScopeDimensionResolution(Guid Value, ScopeSource Source);
