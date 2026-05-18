namespace ArchLucid.Application.Tenancy;

public sealed record TenantErasureOffboardResult(DateTimeOffset OffboardedUtc, DateTimeOffset ErasureEligibleUtc);
