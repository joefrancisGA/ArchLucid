namespace ArchLucid.Architecture.Tests;

/// <summary>
///     A build-graph rule: <c>{ProjectName}/{ProjectName}.csproj</c> must (not) declare
///     <paramref name="ReferencedProjects"/> as <c>ProjectReference</c>.
/// </summary>
/// <remarks>
///     Project-file rules catch a regression at edit time, before the offending code exists; the matching
///     assembly-metadata rule only fires once someone actually consumes a type across the boundary.
/// </remarks>
/// <param name="ProjectName">Project folder name under the repository root.</param>
/// <param name="ReferencedProjects">Referenced project folder names.</param>
/// <param name="Expectation">Whether the reference is banned or pinned by design.</param>
/// <param name="Because">Assertion rationale.</param>
internal sealed record ProjectReferenceConstraint(
    string ProjectName,
    IReadOnlyList<string> ReferencedProjects,
    ArchitectureReferenceExpectation Expectation,
    string Because);
