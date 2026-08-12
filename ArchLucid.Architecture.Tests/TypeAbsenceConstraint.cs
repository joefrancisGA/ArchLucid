namespace ArchLucid.Architecture.Tests;

/// <summary>
///     A placement rule: <paramref name="AssemblyName"/> must not contain the types named in
///     <paramref name="TypeNames"/> (they belong to another tier).
/// </summary>
/// <param name="AssemblyName">Assembly registered in <see cref="ArchitectureConstraintAssemblies"/>.</param>
/// <param name="TypeNames">Simple type names (not namespace-qualified).</param>
/// <param name="Scope">Public surface only, or all types including internal ones.</param>
/// <param name="Because">Assertion rationale.</param>
internal sealed record TypeAbsenceConstraint(
    string AssemblyName,
    IReadOnlyList<string> TypeNames,
    ArchitectureTypeVisibilityScope Scope,
    string Because);
