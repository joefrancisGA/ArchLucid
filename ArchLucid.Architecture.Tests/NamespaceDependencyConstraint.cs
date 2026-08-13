namespace ArchLucid.Architecture.Tests;

/// <summary>
///     A NetArchTest rule: types of <paramref name="AssemblyName"/> must not depend on any
///     <paramref name="ForbiddenNamespaces"/> prefix.
/// </summary>
/// <param name="AssemblyName">Assembly registered in <see cref="ArchitectureConstraintAssemblies"/>.</param>
/// <param name="ForbiddenNamespaces">Namespace prefixes passed to <c>HaveDependencyOnAny</c>.</param>
/// <param name="Because">Assertion rationale (architecture intent, not a restatement of the rule).</param>
internal sealed record NamespaceDependencyConstraint(
    string AssemblyName,
    IReadOnlyList<string> ForbiddenNamespaces,
    string Because)
{
    /// <summary>
    ///     Type names excluded from the scan. Used where NetArchTest prefix matching false-positives
    ///     (for example configuration POCOs named after another area).
    /// </summary>
    internal IReadOnlyList<string> ExcludedTypeNames { get; init; } = [];

    /// <summary>Restricts the scan to types in this namespace (adapter-to-port seams).</summary>
    internal string? OnlyTypesInNamespace { get; init; }

    /// <summary>Excludes types in this namespace from the scan (the one authorized cross-boundary slice).</summary>
    internal string? ExceptTypesInNamespace { get; init; }
}
