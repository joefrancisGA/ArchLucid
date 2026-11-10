namespace ArchLucid.Api.Tests;

/// <summary>Stable GUIDs for negative-path harness tests (never collide with seeded runs).</summary>
internal static class HarnessWellKnownGuids
{
    internal static readonly Guid UnknownAuthorityRunForSummary = Guid.Parse("00000000-0000-0000-0000-00000000cc01");

    internal static readonly Guid UnknownCanonicalRunDetail = Guid.Parse("00000000-0000-0000-0000-00000000cc02");

    internal static readonly Guid UnknownAuthorityRunForSmoke = Guid.Parse("00000000-0000-0000-0000-00000000cc03");

    internal static readonly Guid UnknownRunForReviewSubresource = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    internal static readonly Guid UnknownRunForEvidenceChain = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    internal static readonly Guid MismatchedRunForScopedFindingInspect = Guid.Parse("11111111-1111-1111-1111-111111111111");

    internal static readonly Guid UnknownRunForStoredEvidenceFiles = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
}
