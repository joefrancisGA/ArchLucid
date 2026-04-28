using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Tests;

/// <summary>Returns a fixed <see cref="ScopeContext" /> for SQL contract tests.</summary>
internal sealed class FixedTestScopeContextProvider(ScopeContext scope) : IScopeContextProvider
{
    public ScopeContext GetCurrentScope() => scope;
}
