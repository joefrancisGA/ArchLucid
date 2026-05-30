using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.StarterProofPacks;

/// <summary>
///     Deterministic dry-run: starter-pack architecture requests deserialize without Azure credentials (TB-116).
/// </summary>
[Trait("Category", "Unit")]
public sealed class StarterProofPackArchitectureRequestDryRunTests
{
    public static TheoryData<string> StarterArchitectureRequestRelativePaths =>
    [
        Path.Combine("templates", "starter-proof-packs", "regulated-saas-soc-procurement", "architecture-request.json"),
        Path.Combine("templates", "starter-proof-packs", "healthcare-data-workflow", "architecture-request.json"),
        Path.Combine("templates", "starter-proof-packs", "azure-cost-governance", "architecture-request.json"),
        Path.Combine("templates", "starter-proof-packs", "ai-llm-workload", "architecture-request.json"),
    ];

    [Theory]
    [MemberData(nameof(StarterArchitectureRequestRelativePaths))]
    public void Architecture_request_json_deserializes_for_simulator_dry_run(string relativePath)
    {
        string fullPath = Path.Combine(AppContext.BaseDirectory, relativePath);

        File.Exists(fullPath).Should().BeTrue($"copy starter template to test output: {fullPath}");

        string json = File.ReadAllText(fullPath);

        using JsonDocument document = JsonDocument.Parse(json);
        JsonElement root = document.RootElement;

        root.GetProperty("requestId").GetString().Should().NotBeNullOrWhiteSpace();
        root.GetProperty("description").GetString().Should().NotBeNullOrWhiteSpace();
        root.GetProperty("systemName").GetString().Should().NotBeNullOrWhiteSpace();
    }
}
