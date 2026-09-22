using System.Text;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-054 ratchet: architecture-spine bind wave must not fork a second Azure collector.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs054ForbiddenCollectorArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string ContractRelativePath = "docs/library/ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md";

    private static readonly string[] ArchitectureBindSourceRoots =
    [
        "ArchLucid.Application/Architecture",
        "ArchLucid.Api/Controllers/Architecture",
    ];

    private static readonly string[] ForbiddenCollectorTypeNameFragments =
    [
        "ArmHarvest",
        "AzureResourceGraphClient",
        "InlineArmCollector",
        "ReviewApiAzureCollector",
        "ArchitectureInventoryCollector",
        "DuplicateAzureExtractor",
        "SecondAzureCollector",
    ];

    private static readonly string[] ForbiddenCollectorDependencyTokens =
    [
        "IHostedAzureExtractorClient",
        "HostedAzureExtractorClient",
        "Get-ArchLucidAzurePackage",
        "AzureResourceGraph",
    ];

    [Fact]
    public void As054_contract_lists_forbidden_second_collector_type_names()
    {
        string path = Path.Combine(RepoRoot, ContractRelativePath);
        string contract = File.ReadAllText(path);

        contract.Should().Contain("AS-054");
        contract.Should().Contain("Forbidden type names");

        foreach (string fragment in ForbiddenCollectorTypeNameFragments)
        {
            contract.Should().Contain(fragment, $"contract must list forbidden collector type fragment '{fragment}'");
        }
    }

    [Fact]
    public void Architecture_bind_paths_do_not_declare_forbidden_collector_types()
    {
        List<string> violations = [];

        foreach (string relativeRoot in ArchitectureBindSourceRoots)
        {
            string directory = Path.Combine(RepoRoot, relativeRoot);

            if (!Directory.Exists(directory))
                continue;

            foreach (string filePath in Directory.EnumerateFiles(directory, "*.cs", SearchOption.AllDirectories))
            {
                if (IsBuildOutput(filePath))
                    continue;

                string text = File.ReadAllText(filePath, Encoding.UTF8);
                string relativePath = Path.GetRelativePath(RepoRoot, filePath);

                foreach (string fragment in ForbiddenCollectorTypeNameFragments)
                {
                    if (text.Contains($"class {fragment}", StringComparison.Ordinal)
                        || text.Contains($"interface I{fragment}", StringComparison.Ordinal)
                        || text.Contains($"record {fragment}", StringComparison.Ordinal))
                    {
                        violations.Add($"{relativePath}: declares forbidden collector type '{fragment}'");
                    }
                }
            }
        }

        violations.Should().BeEmpty(
            "AS-054: architecture inventory bind must consume IE snapshots, not fork collectors: "
            + string.Join("; ", violations.OrderBy(static s => s, StringComparer.Ordinal)));
    }

    [Fact]
    public void Architecture_bind_paths_do_not_reference_extractor_harvest_dependencies()
    {
        List<string> violations = [];

        foreach (string relativeRoot in ArchitectureBindSourceRoots)
        {
            string directory = Path.Combine(RepoRoot, relativeRoot);

            if (!Directory.Exists(directory))
                continue;

            foreach (string filePath in Directory.EnumerateFiles(directory, "*.cs", SearchOption.AllDirectories))
            {
                if (IsBuildOutput(filePath))
                    continue;

                string text = File.ReadAllText(filePath, Encoding.UTF8);
                string relativePath = Path.GetRelativePath(RepoRoot, filePath);

                foreach (string token in ForbiddenCollectorDependencyTokens)
                {
                    if (text.Contains(token, StringComparison.Ordinal))
                        violations.Add($"{relativePath}: references forbidden collector dependency '{token}'");
                }
            }
        }

        string overlayApplicator = Path.Combine(
            RepoRoot,
            "ArchLucid.Application/Runs/Orchestration/Pipeline/BoundArchitectureInventoryGraphOverlayApplicator.cs");

        if (File.Exists(overlayApplicator))
        {
            string text = File.ReadAllText(overlayApplicator, Encoding.UTF8);

            foreach (string token in ForbiddenCollectorDependencyTokens)
            {
                if (text.Contains(token, StringComparison.Ordinal))
                    violations.Add($"BoundArchitectureInventoryGraphOverlayApplicator.cs: references forbidden collector dependency '{token}'");
            }
        }

        violations.Should().BeEmpty(
            "AS-054: bind/overlay paths must read snapshot rows via repositories only: "
            + string.Join("; ", violations.OrderBy(static s => s, StringComparer.Ordinal)));
    }

    private static bool IsBuildOutput(string path) =>
        path.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.Ordinal)
        || path.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.Ordinal);

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
