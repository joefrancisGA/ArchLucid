using ArchLucid.Application.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceRunIdNormalizerTests
{
    [Fact]
    public void AreEquivalent_accepts_dashed_and_canonical_guid_formats()
    {
        Guid runGuid = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        GovernanceRunIdNormalizer
            .AreEquivalent(runGuid.ToString("N"), runGuid.ToString("D"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void AreEquivalent_treats_outer_whitespace_on_opaque_run_ids_as_equivalent()
    {
        GovernanceRunIdNormalizer
            .AreEquivalent("architecture-run-key", "  architecture-run-key  ")
            .Should()
            .BeTrue("correction and preview bodies normalize inbound run ids but persisted subjects can retain outer padding");
    }

    [Fact]
    public void AreEquivalent_treats_invisible_unicode_on_opaque_run_ids_as_equivalent()
    {
        GovernanceRunIdNormalizer
            .AreEquivalent("architecture-run-key", $"\u200Barchitecture-run-key")
            .Should()
            .BeTrue("ApiKeyMaterialNormalizer strips format characters used in pasted run-id fields");
    }
}
