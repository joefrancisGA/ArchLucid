using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// ESI-001 ratchet: stored evidence catalog API and UI inspect ladder exist.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class EvidenceSourceInspectEsi001ArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Esi001_catalog_controller_and_ui_cells_exist()
    {
        string controller = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ReviewStoredEvidenceFilesController.cs"));
        string cells = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "runs",
                "StoredEvidenceFileCells.tsx"));
        string inventory = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "evidence-source-inspect-inventory.ts"));

        controller.Should().Contain("ReviewStoredEvidenceFilesController");
        cells.Should().Contain("Submitted evidence preview");
        inventory.Should().Contain("RunStoredEvidenceFiles");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
