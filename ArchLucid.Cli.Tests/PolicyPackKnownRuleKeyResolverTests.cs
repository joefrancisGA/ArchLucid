using ArchLucid.Cli.Validation;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PolicyPackKnownRuleKeyResolverTests
{
    [Fact]
    public void TryLoadKnownRuleKeys_includes_rule_ids_from_output_rule_pack_directory()
    {
        string rulePackDir = Path.Combine(AppContext.BaseDirectory, "Compliance", "RulePacks");
        Directory.CreateDirectory(rulePackDir);
        string filePath = Path.Combine(rulePackDir, $"coverage-{Guid.NewGuid():N}.rules.json");

        try
        {
            File.WriteAllText(
                filePath,
                """
                {
                  "rules": [
                    { "ruleId": "coverage-known-rule-alpha" },
                    { "ruleId": "coverage-known-rule-beta" }
                  ]
                }
                """);

            HashSet<string> keys = PolicyPackKnownRuleKeyResolver.TryLoadKnownRuleKeys();

            keys.Should().Contain("coverage-known-rule-alpha");
            keys.Should().Contain("coverage-known-rule-beta");
        }
        finally
        {
            if (File.Exists(filePath))
                File.Delete(filePath);
        }
    }
}
