using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "KnowledgeGraph")]
public sealed class SecureNowInventoryEdgeArchitectureTests
{
    [Fact]
    public void InfraEvidence_materializer_sources_do_not_add_management_azure_com_inventory_clients()
    {
        string repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
        string[] searchRoots =
        [
            Path.Combine(repoRoot, "ArchLucid.Application", "InfraEvidence"),
            Path.Combine(repoRoot, "ArchLucid.Core", "InfraEvidence"),
            Path.Combine(repoRoot, "ArchLucid.Persistence", "InfraEvidence"),
        ];

        foreach (string root in searchRoots)
        {
            if (!Directory.Exists(root))
            {
                continue;
            }

            foreach (string file in Directory.EnumerateFiles(root, "*.cs", SearchOption.AllDirectories))
            {
                string contents = File.ReadAllText(file);
                contents.Should().NotContain(
                    "management.azure.com",
                    because: $"SA-02 requires one collector family — no new ARM inventory clients in {file}");
            }
        }
    }
}
