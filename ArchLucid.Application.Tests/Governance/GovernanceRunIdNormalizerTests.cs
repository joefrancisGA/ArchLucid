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

    [Fact]
    public void AreEquivalent_treats_nfc_and_nfd_opaque_run_ids_as_equivalent()
    {
        const string nfc = "architecture-caf\u00e9-key";
        const string nfd = "architecture-cafe\u0301-key";

        GovernanceRunIdNormalizer
            .AreEquivalent(nfc, nfd)
            .Should()
            .BeTrue("bulk simulate dedupes opaque ids with GovernanceRunIdNormalizer.AreEquivalent");
    }

    [Fact]
    public void AreEquivalent_treats_formd_and_nfc_ascii_opaque_run_ids_as_equivalent()
    {
        const string nfc = "architecture-run-key";
        string nfd = "architecture-run-key".Normalize(System.Text.NormalizationForm.FormD);

        GovernanceRunIdNormalizer
            .AreEquivalent(nfc, nfd)
            .Should()
            .BeTrue("ASCII opaque ids are unchanged by FormD; bulk correction subjects stay equivalent");
    }

    [Fact]
    public void AreEquivalent_treats_turkish_dotted_capital_I_and_ascii_lowercase_i_as_distinct_opaque_ids()
    {
        GovernanceRunIdNormalizer
            .AreEquivalent("run-i-key", "run-\u0130-key")
            .Should()
            .BeFalse("opaque governance run ids keep ordinal identity beyond ASCII case-insensitive dedupe");
    }

    [Fact]
    public void AreEquivalent_treats_ascii_case_only_opaque_run_ids_as_distinct()
    {
        GovernanceRunIdNormalizer
            .AreEquivalent("Run-A", "run-a")
            .Should()
            .BeFalse("mutation correction finalize subjects use ordinal opaque identity; bulk simulate adds a separate ASCII case-insensitive dedupe pass");
    }
}
