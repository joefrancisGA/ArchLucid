using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Scoping;

/// <summary>
///     Returns an empty scope triple for CLI / tools that persist SQL rows without HTTP ambient scope.
///     Prefer a real <see cref="IScopeContextProvider" /> in hosted scenarios; RLS bypass is typical for backfill jobs.
/// </summary>
public sealed class EmptyPersistenceScopeContextProvider : IScopeContextProvider
{
    private static readonly ScopeContext EmptyScope = new();

    /// <inheritdoc />
    public ScopeContext GetCurrentScope() => EmptyScope;

    /// <inheritdoc />
    public ScopeResolution ResolveCurrentScope() =>
        ScopeResolution.FromUniformSource(EmptyScope, ScopeSource.Default);
}
