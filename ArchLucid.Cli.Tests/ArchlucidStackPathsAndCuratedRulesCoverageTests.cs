using ArchLucid.Cli.Stack;
using ArchLucid.Cli.Validation;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchlucidStackPathsAndCuratedRulesCoverageTests
{
    [Fact]
    public void ArchlucidStackPaths_exposes_deploy_relative_paths()
    {
        ArchlucidStackPaths.SchemaRelativePath.Should().Be("deploy/archlucid.stack.schema.json");
        ArchlucidStackPaths.ExampleRelativePath.Should().Be("deploy/archlucid.stack.example.yaml");
        ArchlucidStackPaths.GeneratedRootRelativePath.Should().Be("deploy/generated");
        ArchlucidStackPaths.DefaultAnswersFileName.Should().Be("archlucid.stack.yaml");
    }

    [Fact]
    public void PolicyPackCuratedRuleKeyReader_returns_empty_when_metadata_missing()
    {
        IReadOnlyCollection<string> ids =
            PolicyPackCuratedRuleKeyReader.ReadRuleIdsFromMetadata(new Dictionary<string, string>());

        ids.Should().BeEmpty();
    }

    [Fact]
    public void PolicyPackCuratedRuleKeyReader_parses_rule_ids_from_metadata_json()
    {
        const string json = """{"rules":[{"id":"rule.alpha"},{"id":" rule.beta "}]}""";
        Dictionary<string, string> metadata = new()
        {
            ["pack.curatedRules.v1"] = json,
        };

        IReadOnlyCollection<string> ids = PolicyPackCuratedRuleKeyReader.ReadRuleIdsFromMetadata(metadata);

        ids.Should().BeEquivalentTo(["rule.alpha", "rule.beta"]);
    }

    [Fact]
    public void PolicyPackCuratedRuleKeyReader_returns_empty_on_invalid_json()
    {
        Dictionary<string, string> metadata = new()
        {
            ["pack.curatedRules.v1"] = "{not-json",
        };

        PolicyPackCuratedRuleKeyReader.ReadRuleIdsFromMetadata(metadata).Should().BeEmpty();
    }
}
