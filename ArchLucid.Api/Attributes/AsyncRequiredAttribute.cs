namespace ArchLucid.Api.Attributes;

/// <summary>
///     Marks a controller action as Tier C / D work that must accept via <c>202 Accepted</c>
///     (async sibling), not a multi-minute synchronous <c>200</c> hold.
/// </summary>
/// <remarks>
///     Enforcement is CI (<c>scripts/ci/check_api_latency_tiers.py</c> / <b>TB-2079</b>), not a runtime filter.
///     Pair with <c>[ProducesResponseType(StatusCodes.Status202Accepted)]</c> and a <c>Location</c> operation handle.
/// </remarks>
[AttributeUsage(AttributeTargets.Method, AllowMultiple = false, Inherited = false)]
public sealed class AsyncRequiredAttribute : Attribute;
