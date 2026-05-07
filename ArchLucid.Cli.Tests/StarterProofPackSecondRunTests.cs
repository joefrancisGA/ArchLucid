using ArchLucid.Cli.SecondRun;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

/// <summary>Validates shipped <c>templates/starter-proof-packs/*/second-run.json</c> files parse with <see cref="SecondRunInputParser" />.</summary>
[Trait("Suite", "Core")]
public sealed class StarterProofPackSecondRunTests
{
    public static TheoryData<string> StarterSecondRunRelativePaths =>
    [
        Path.Combine("templates", "starter-proof-packs", "regulated-saas-soc-procurement", "second-run.json"),
        Path.Combine("templates", "starter-proof-packs", "healthcare-data-workflow", "second-run.json"),
        Path.Combine("templates", "starter-proof-packs", "azure-cost-governance", "second-run.json"),
        Path.Combine("templates", "starter-proof-packs", "ai-llm-workload", "second-run.json")
    ];

    [Theory]
    [MemberData(nameof(StarterSecondRunRelativePaths))]
    public void Starter_second_run_json_parses_to_architecture_request(string relativePath)
    {
        string fullPath = Path.Combine(AppContext.BaseDirectory, relativePath);

        if (!File.Exists(fullPath))
            throw new FileNotFoundException($"Copy template to test output: {fullPath}");

        SecondRunParseOutcome outcome = SecondRunInputParser.ParseFromFile(fullPath);

        outcome.IsSuccess.Should().BeTrue(outcome.Message ?? "parse failed");
        outcome.Request.Should().NotBeNull();
        outcome.Request!.SystemName.Should().NotBeNullOrWhiteSpace();
        outcome.Request.Description.Length.Should().BeGreaterOrEqualTo(10);
        outcome.Request.RequestId.Should().NotBeNullOrWhiteSpace();
        outcome.Request.RequestId.Length.Should().BeLessOrEqualTo(64);
    }
}
