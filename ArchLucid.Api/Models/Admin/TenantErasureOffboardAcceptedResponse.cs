namespace ArchLucid.Api.Models.Admin;

public sealed record TenantErasureOffboardAcceptedResponse(DateTimeOffset OffboardedUtc, DateTimeOffset ErasureEligibleUtc);
