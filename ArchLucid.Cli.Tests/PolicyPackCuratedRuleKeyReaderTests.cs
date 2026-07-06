using ArchLucid.Cli.Validation;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PolicyPackCuratedRuleKeyReaderTests
{
    [Fact]
    public void ReadRuleIdsFromMetadata_returns_empty_when_metadata_missing_or_invalid()
    {
        PolicyPackCuratedRuleKeyReader.ReadRuleIdsFromMetadata(new Dictionary<string, string>())
            .Should().BeEmpty();

        Dictionary<string, string> invalid = new()
        {
            ["pack.curatedRules.v1"] = "{ not-json",
        };

        PolicyPackCuratedRuleKeyReader.ReadRuleIdsFromMetadata(invalid).Should().BeEmpty();
    }

    [Fact]
    public void ReadRuleIdsFromMetadata_parses_curated_rule_ids()
    {
        Dictionary<string, string> metadata = new()
        {
            ["pack.curatedRules.v1"] =
                """
                {
                  "rules": [
                    { "id": "network-encryption-at-rest" },
                    { "id": "  " },
                    { "id": "identity-mfa-required" }
                  ]
                }
                """,
        };

        IReadOnlyCollection<string> ids = PolicyPackCuratedRuleKeyReader.ReadRuleIdsFromMetadata(metadata);

        ids.Should().BeEquivalentTo(["network-encryption-at-rest", "identity-mfa-required"]);
    }
}
