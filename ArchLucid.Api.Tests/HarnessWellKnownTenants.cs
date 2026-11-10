namespace ArchLucid.Api.Tests;

/// <summary>Stable tenant ids for harness isolation negatives (never collide with seeded tenants).</summary>
internal static class HarnessWellKnownTenants
{
    internal static readonly Guid ForeignTenantId = Guid.Parse("77777777-7777-7777-7777-777777777777");

    internal static string ForeignTenantHeaderValue => ForeignTenantId.ToString("D");
}
