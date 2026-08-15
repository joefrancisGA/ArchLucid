using System.Text.Json;
using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-328: FindingSeverity enum ↔ SeverityTag semantic contract stays aligned.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingSeverityTagSemanticContractArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Tb328_contract_json_exists_and_covers_contract_enum()
    {
        string path = Path.Combine(RepoRoot, "docs", "library", "FINDING_SEVERITY_TAG_SEMANTIC_CONTRACT.json");
        File.Exists(path).Should().BeTrue();

        using JsonDocument doc = JsonDocument.Parse(File.ReadAllText(path));
        JsonElement mappings = doc.RootElement.GetProperty("mappings");
        mappings.GetArrayLength().Should().Be(4);

        string[] names = mappings.EnumerateArray()
            .Select(static element => element.GetProperty("enumName").GetString()!)
            .ToArray();

        names.Should().Contain(["Info", "Warning", "Error", "Critical"]);
    }

    [Fact]
    public void Tb328_backend_enum_values_match_contract()
    {
        string enumPath = Path.Combine(RepoRoot, "ArchLucid.Contracts", "Findings", "FindingSeverity.cs");
        string enumText = File.ReadAllText(enumPath);

        MatchCollection matches = Regex.Matches(enumText, @"^\s*(Info|Warning|Error|Critical)\s*=\s*(\d+)\s*,?\s*$", RegexOptions.Multiline);
        matches.Count.Should().Be(4);

        string contractPath = Path.Combine(RepoRoot, "docs", "library", "FINDING_SEVERITY_TAG_SEMANTIC_CONTRACT.json");
        using JsonDocument doc = JsonDocument.Parse(File.ReadAllText(contractPath));

        foreach (JsonElement mapping in doc.RootElement.GetProperty("mappings").EnumerateArray())
        {
            string enumName = mapping.GetProperty("enumName").GetString()!;
            int enumValue = mapping.GetProperty("enumValue").GetInt32();

            Match match = matches.First(m => m.Groups[1].Value == enumName);
            int.Parse(match.Groups[2].Value, System.Globalization.CultureInfo.InvariantCulture)
                .Should()
                .Be(enumValue);
        }
    }

    [Fact]
    public void Tb328_ui_contract_module_and_vitest_exist()
    {
        string modulePath = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "lib",
            "findings",
            "finding-severity-tag-semantic-contract.ts");

        string testPath = Path.Combine(
            RepoRoot,
            "archlucid-ui",
            "src",
            "lib",
            "findings",
            "finding-severity-tag-semantic-contract.test.ts");

        File.Exists(modulePath).Should().BeTrue();
        File.Exists(testPath).Should().BeTrue();
        File.ReadAllText(modulePath).Should().Contain("listFindingSeverityContractMismatches");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
