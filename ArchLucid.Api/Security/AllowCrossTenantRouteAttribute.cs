namespace ArchLucid.Api.Security;

/// <summary>
///     Opts an action or controller out of <see cref="RouteTenantScopeBindingFilter" /> when the route carries a
///     platform-scoped tenant identifier (for example internal cross-tenant analytics).
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
public sealed class AllowCrossTenantRouteAttribute : Attribute;
