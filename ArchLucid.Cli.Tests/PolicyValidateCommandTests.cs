using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Suite", "Core")]
public sealed class PolicyValidateCommandTests
{
    [Fact]
    public async Task RunAsync_when_empty_guid_in_compliance_rule_ids_returns_usage_error()
    {
        string temp = Path.Combine(Path.GetTempPath(), $"archlucid-policy-pack-{Guid.NewGuid():N}.json");

        await File.WriteAllTextAsync(
            temp,
            """
            {
              "complianceRuleIds": ["00000000-0000-0000-0000-000000000000"],
              "complianceRuleKeys": [],
              "alertRuleIds": [],
              "compositeAlertRuleIds": [],
              "advisoryDefaults": {},
              "metadata": {}
            }
            """);

        try
        {
            int exit = await PolicyValidateCommand.RunAsync(temp, "policy-pack validate");

            exit.Should().Be(CliExitCode.UsageError);
        }
        finally
        {
            File.Delete(temp);
        }
    }

    [Fact]
    public async Task RunAsync_when_document_valid_returns_success()
    {
        string temp = Path.Combine(Path.GetTempPath(), $"archlucid-policy-pack-{Guid.NewGuid():N}.json");

        await File.WriteAllTextAsync(
            temp,
            """
            {
              "complianceRuleIds": [],
              "complianceRuleKeys": ["network-must-have-security-baseline"],
              "alertRuleIds": [],
              "compositeAlertRuleIds": [],
              "advisoryDefaults": {},
              "metadata": {}
            }
            """);

        try
        {
            int exit = await PolicyValidateCommand.RunAsync(temp, "policy-pack validate");

            exit.Should().Be(CliExitCode.Success);
        }
        finally
        {
            File.Delete(temp);
        }
    }
}
