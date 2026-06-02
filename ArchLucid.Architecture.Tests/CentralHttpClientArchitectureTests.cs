using System.Text;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>INV-010: product code registers outbound HTTP through the composed handler chain — no ad-hoc <c>new HttpClient()</c>.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CentralHttpClientArchitectureTests
{
    private static readonly string[] ProductRelativeRoots =
    [
        "ArchLucid.Application",
        "ArchLucid.Api",
        "ArchLucid.AgentRuntime",
        "ArchLucid.Persistence",
        "ArchLucid.Host.Core",
        "ArchLucid.Host.Composition",
        "ArchLucid.Worker",
        "ArchLucid.Notifications",
        "ArchLucid.Retrieval",
        "ArchLucid.Integrations.AzureExtractor",
    ];

    private static readonly HashSet<string> AllowedHttpClientConstructionFiles =
    [
        "CosmosEmulatorHttpClientFactory.cs",
    ];

    [Fact]
    public void Product_assemblies_do_not_construct_HttpClient_directly()
    {
        string root = FindRepoRoot();
        List<string> violations = [];

        foreach (string rel in ProductRelativeRoots)
        {
            string dir = Path.Combine(root, rel);

            if (!Directory.Exists(dir))
                continue;

            foreach (string path in Directory.EnumerateFiles(dir, "*.cs", SearchOption.AllDirectories))
            {
                if (IsBuildOutput(path))
                    continue;

                if (AllowedHttpClientConstructionFiles.Contains(Path.GetFileName(path)))
                    continue;

                string text = File.ReadAllText(path, Encoding.UTF8);

                if (text.Contains("new HttpClient(", StringComparison.Ordinal))
                    violations.Add(Path.GetRelativePath(root, path));
            }
        }

        violations.Should().BeEmpty(
            "INV-010: register IHttpClientFactory / typed clients instead of new HttpClient(): "
            + string.Join("; ", violations.OrderBy(static s => s, StringComparer.Ordinal)));
    }

    private static bool IsBuildOutput(string path) =>
        path.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase)
        || path.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase);

    private static string FindRepoRoot()
    {
        for (DirectoryInfo? directory = new(AppContext.BaseDirectory); directory != null; directory = directory.Parent)
        {
            string sln = Path.Combine(directory.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
                return directory.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from AppContext.BaseDirectory.");
    }
}
