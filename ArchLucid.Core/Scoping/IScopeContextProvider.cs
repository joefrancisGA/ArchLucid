namespace ArchLucid.Core.Scoping;

/// <summary>
///     Resolves the current tenant / workspace / project scope (e.g. from HTTP claims or dev headers).
/// </summary>
/// <remarks>
///     Default host implementation: <c>ArchLucid.Host.Core.Auth.Services.HttpScopeContextProvider</c>, which prefers
///     <see cref="AmbientScopeContext.CurrentOverride" /> when set (e.g. advisory scan), then JWT scope claims over
///     <c>x-*-id</c> headers
///     so token-bound scope cannot be overridden by headers.
/// </remarks>
public interface IScopeContextProvider
{
    /// <summary>
    ///     Returns the active scope: ambient override if pushed, otherwise derived from the current HTTP user/headers (or
    ///     defaults in dev).
    /// </summary>
    /// <returns>Non-null <see cref="ScopeContext" />; ids may be well-known defaults when unauthenticated in development.</returns>
    ScopeContext GetCurrentScope();

    /// <summary>
    ///     Returns scope plus per-dimension source metadata for fail-closed production-like guards (TB-304).
    /// </summary>
    /// <remarks>
    ///     Default implementation treats the resolved scope as an ambient job override. Host HTTP providers override with
    ///     claim/header/default source tracking.
    /// </remarks>
    ScopeResolution ResolveCurrentScope() =>
        ScopeResolution.FromUniformSource(GetCurrentScope(), ScopeSource.Ambient);
}
