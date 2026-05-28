using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Tests.Support;

/// <summary>
///     Returns a fixed scope triple for repository contract and isolation tests.
/// </summary>
internal sealed class FixedPersistenceScopeContextProvider(ScopeContext scope) : IScopeContextProvider
{
    private readonly ScopeContext _scope = scope ?? throw new ArgumentNullException(nameof(scope));

    public ScopeContext GetCurrentScope() => _scope;
}
