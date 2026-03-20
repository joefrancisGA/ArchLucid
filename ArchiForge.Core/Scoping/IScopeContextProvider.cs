namespace ArchiForge.Core.Scoping;

/// <summary>
/// Resolves the current tenant / workspace / project scope (e.g. from HTTP claims or dev headers).
/// </summary>
public interface IScopeContextProvider
{
    ScopeContext GetCurrentScope();
}
