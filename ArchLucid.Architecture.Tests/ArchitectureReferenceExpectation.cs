namespace ArchLucid.Architecture.Tests;

/// <summary>Whether a declared dependency edge is banned or deliberately pinned.</summary>
internal enum ArchitectureReferenceExpectation
{
    /// <summary>The edge must not exist.</summary>
    Forbidden = 0,

    /// <summary>The edge exists by design and is pinned so removal or drift is a deliberate decision.</summary>
    Required = 1,
}
