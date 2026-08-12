namespace ArchLucid.Architecture.Tests;

/// <summary>
///     A compiled-metadata rule: <paramref name="AssemblyName"/> must (not) reference
///     <paramref name="ReferencedAssemblies"/>.
/// </summary>
/// <remarks>
///     Assembly metadata is the right instrument where NetArchTest namespace matching false-positives, for
///     example port interfaces that live in <c>ArchLucid.Core</c> under an <c>ArchLucid.Persistence.*</c> namespace.
/// </remarks>
/// <param name="AssemblyName">Assembly registered in <see cref="ArchitectureConstraintAssemblies"/>.</param>
/// <param name="ReferencedAssemblies">Simple assembly names, first-party or third-party.</param>
/// <param name="Expectation">Whether the reference is banned or pinned by design.</param>
/// <param name="Because">Assertion rationale.</param>
internal sealed record AssemblyReferenceConstraint(
    string AssemblyName,
    IReadOnlyList<string> ReferencedAssemblies,
    ArchitectureReferenceExpectation Expectation,
    string Because);
