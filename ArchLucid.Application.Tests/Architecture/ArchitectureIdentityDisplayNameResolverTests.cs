using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureIdentityDisplayNameResolverTests
{
    [Fact]
    public void ResolveFromDraft_prefers_system_name_then_intent_then_untitled()
    {
        ArchitectureIdentityDisplayNameResolver.ResolveFromDraft(new DraftRequestDocument
        {
            SystemName = "  Payments API  ",
            FreeTextIntent = "fallback intent",
        }).Should().Be("Payments API");

        ArchitectureIdentityDisplayNameResolver.ResolveFromDraft(new DraftRequestDocument
        {
            FreeTextIntent = "  Retail checkout  ",
        }).Should().Be("Retail checkout");

        ArchitectureIdentityDisplayNameResolver.ResolveFromDraft(new DraftRequestDocument())
            .Should()
            .Be(ArchitectureIdentityDisplayNameDefaults.UntitledArchitecture);
    }

    [Fact]
    public void ResolveUntitledUpgradeCandidate_returns_system_name_only()
    {
        ArchitectureIdentityDisplayNameResolver.ResolveUntitledUpgradeCandidate(new DraftRequestDocument
        {
            SystemName = "Platform",
            FreeTextIntent = "Do not use intent for upgrade",
        }).Should().Be("Platform");

        ArchitectureIdentityDisplayNameResolver.ResolveUntitledUpgradeCandidate(new DraftRequestDocument
        {
            FreeTextIntent = "Intent only",
        }).Should().BeNull();
    }
}
