using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class ProseAssumptionFaithfulnessValidatorTests
{
    [Fact]
    public void IsSpanGrounded_returns_true_when_quoted_span_exists_on_cited_line()
    {
        ProseAssumptionCandidate candidate = new()
        {
            Statement = "The storage account must not be public.",
            DocumentPath = "architecture.md",
            LineNumber = 2,
            QuotedSpan = "must not be public",
            LogicalPropertyName = DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
            ImpliedPropertyValue = "Disabled",
        };

        Dictionary<string, string> documents = new(StringComparer.OrdinalIgnoreCase)
        {
            ["architecture.md"] = "Overview\nThe storage account must not be public.\n",
        };

        ProseAssumptionFaithfulnessValidator.IsSpanGrounded(candidate, documents).Should().BeTrue();
    }

    [Fact]
    public void IsSpanGrounded_returns_false_when_quoted_span_is_not_in_document()
    {
        ProseAssumptionCandidate candidate = new()
        {
            Statement = "Fabricated assumption",
            DocumentPath = "architecture.md",
            LineNumber = 1,
            QuotedSpan = "must not be public",
            LogicalPropertyName = DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
            ImpliedPropertyValue = "Disabled",
        };

        Dictionary<string, string> documents = new(StringComparer.OrdinalIgnoreCase)
        {
            ["architecture.md"] = "Only private endpoints are allowed.",
        };

        ProseAssumptionFaithfulnessValidator.IsSpanGrounded(candidate, documents).Should().BeFalse();
    }
}
