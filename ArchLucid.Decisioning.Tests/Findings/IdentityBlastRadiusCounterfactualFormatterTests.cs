using ArchLucid.Decisioning.Findings;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Decisioning.Tests.Findings;

public sealed class IdentityBlastRadiusCounterfactualFormatterTests
{
    [Fact]
    public void Format_returns_exact_sentence_when_all_fields_present()
    {
        string? sentence = IdentityBlastRadiusCounterfactualFormatter.Format(
            "checkout-func",
            "Contributor",
            "kv-pay-prod",
            2);

        sentence.Should()
            .Be("If checkout-func lost Contributor on kv-pay-prod, the write/admin path (2 hops) would be removed.");
    }

    [Fact]
    public void Format_returns_null_when_role_name_missing()
    {
        IdentityBlastRadiusCounterfactualFormatter.Format("checkout-func", "", "kv-pay-prod", 2)
            .Should()
            .BeNull();
    }

    [Fact]
    public void TryParseFromNotes_reads_counterfactual_prefix()
    {
        string? sentence = IdentityBlastRadiusCounterfactualFormatter.TryParseFromNotes([
            "evidence:graph-node:actor-checkout",
            "counterfactual:If checkout-func lost Contributor on kv-pay-prod, the write/admin path (2 hops) would be removed.",
        ]);

        sentence.Should().Contain("write/admin path (2 hops)");
    }
}
