using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeclarationSecurityBaselineClassifierTests
{
    [Fact]
    public void Classify_flags_public_network_access_on_storage()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.public_network_access"] = "enabled",
        };

        IReadOnlyList<DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal> signals =
            DeclarationSecurityBaselineClassifier.Classify("docs", properties);

        signals.Should().ContainSingle();
        signals[0].Severity.Should().Be(FindingSeverity.Error);
    }

    [Fact]
    public void Classify_skips_when_attribute_missing()
    {
        IReadOnlyList<DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal> signals =
            DeclarationSecurityBaselineClassifier.Classify("docs", new Dictionary<string, string>());

        signals.Should().BeEmpty();
    }
}
