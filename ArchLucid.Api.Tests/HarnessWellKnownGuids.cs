namespace ArchLucid.Api.Tests;

/// <summary>Stable GUIDs for negative-path harness tests (never collide with seeded runs).</summary>
internal static class HarnessWellKnownGuids
{
    internal static readonly Guid UnknownAuthorityRunForSummary = Guid.Parse("00000000-0000-0000-0000-00000000cc01");

    internal static readonly Guid UnknownAuthorityRunForSmoke = Guid.Parse("00000000-0000-0000-0000-00000000cc03");
}
