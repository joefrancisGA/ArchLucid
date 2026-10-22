namespace ArchLucid.Api.Models.Admin;

/// <summary>
///     202 body for tenant erasure offboard. <see cref="JobId" /> retains the historic <c>jobId</c> JSON field so the
///     OpenAPI surface stays backward compatible with the pre-quarantine contract (additive timestamps only).
/// </summary>
public sealed record TenantErasureOffboardAcceptedResponse(
    string JobId,
    DateTimeOffset OffboardedUtc,
    DateTimeOffset ErasureEligibleUtc);
