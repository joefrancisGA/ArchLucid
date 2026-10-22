namespace ArchLucid.Api.Security;

/// <summary>
///     Opts an action or controller out of <see cref="ScopeResolutionGuardMiddleware" /> when the route is legitimately
///     scope-free (marketing, webhooks, health-adjacent APIs) on production-like hosts (TB-304).
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
public sealed class AllowUnscopedRouteAttribute : Attribute;
