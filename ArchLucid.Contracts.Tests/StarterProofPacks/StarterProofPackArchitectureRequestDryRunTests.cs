using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.StarterProofPacks;

/// <summary>
///     Deterministic dry-run: starter-pack architecture requests deserialize without Azure credentials (TB-116/TB-117).
/// </summary>
[Trait("Category", "Unit")]
public sealed class StarterProofPackArchitectureRequestDryRunTests
{
    private static readonly string[] PackFolderNames =
    [
        "regulated-saas-soc-procurement",
        "healthcare-data-workflow",
        "azure-cost-governance",
        "ai-llm-workload",
    ];

    public static TheoryData<string> StarterArchitectureRequestRelativePaths =>
    [
        Path.Combine("templates", "starter-proof-packs", "regulated-saas-soc-procurement", "architecture-request.json"),
        Path.Combine("templates", "starter-proof-packs", "healthcare-data-workflow", "architecture-request.json"),
        Path.Combine("templates", "starter-proof-packs", "azure-cost-governance", "architecture-request.json"),
        Path.Combine("templates", "starter-proof-packs", "ai-llm-workload", "architecture-request.json"),
    ];

    public static TheoryData<string> StarterPackMetadataRelativePaths =>
    [
        Path.Combine("templates", "starter-proof-packs", "regulated-saas-soc-procurement", "starter-pack.json"),
        Path.Combine("templates", "starter-proof-packs", "healthcare-data-workflow", "starter-pack.json"),
        Path.Combine("templates", "starter-proof-packs", "azure-cost-governance", "starter-pack.json"),
        Path.Combine("templates", "starter-proof-packs", "ai-llm-workload", "starter-pack.json"),
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

    [Theory]
    [MemberData(nameof(StarterPackMetadataRelativePaths))]
    public void Starter_pack_metadata_json_has_required_tb115_fields(string relativePath)
    {
        string fullPath = Path.Combine(AppContext.BaseDirectory, relativePath);

        File.Exists(fullPath).Should().BeTrue($"copy starter template to test output: {fullPath}");

        string json = File.ReadAllText(fullPath);

        using JsonDocument document = JsonDocument.Parse(json);
        JsonElement root = document.RootElement;

        root.GetProperty("id").GetString().Should().NotBeNullOrWhiteSpace();
        root.GetProperty("scopeLabel").GetString().Should().NotBeNullOrWhiteSpace();
        root.GetProperty("sourceConfidence").GetString().Should().NotBeNullOrWhiteSpace();
        root.GetProperty("acceptanceChecks").GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public void Each_pack_has_policy_context_and_architecture_request_for_offline_dry_run()
    {
        foreach (string packFolder in PackFolderNames)
        {
            string packRoot = Path.Combine(AppContext.BaseDirectory, "templates", "starter-proof-packs", packFolder);

            Directory.Exists(packRoot).Should().BeTrue($"starter pack folder copied to test output: {packRoot}");

            File.Exists(Path.Combine(packRoot, "architecture-request.json")).Should().BeTrue();
            File.Exists(Path.Combine(packRoot, "policy-context.json")).Should().BeTrue();
            File.Exists(Path.Combine(packRoot, "starter-pack.json")).Should().BeTrue();
        }
    }
}
