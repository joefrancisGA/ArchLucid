using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-026 ratchet: audit CSV export stamps Mode/door and blocks unlabeled Working Career Simulator.
/// Does not reopen ADR 0078 audit CSV body.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg026CareerBlocksAuditCsvArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg026_audit_csv_controller_resolves_career_posture_gate()
    {
        string csvExport = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Admin", "AuditController.Export.Csv.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Admin", "AuditController.CareerPostureGuard.cs"));

        csvExport.Should().Contain("ResolveAuditCsvCareerPostureAsync");
        guard.Should().Contain("AuditExportCareerPostureGate.ResolveForRunFilterAsync");
        guard.Should().Contain("CareerArtifactBlockedProblem");
    }

    [Fact]
    public void Cg026_audit_csv_formatter_includes_posture_columns_and_preamble()
    {
        string formatter = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Formatters", "AuditEventCsvLineFormatter.cs"));

        formatter.Should().Contain("WriteHonestyPreambleAsync");
        formatter.Should().Contain("StructuralExecutionMode");
        formatter.Should().Contain("RehearsalIncomplete");
    }

    [Fact]
    public void Cg026_ts_helper_builds_audit_csv_preamble()
    {
        string helper = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "audit", "audit-export-career-posture.ts"));

        helper.Should().Contain("buildAuditExportCsvHonestyPreambleLines");
        helper.Should().Contain("resolveAuditExportCareerBlockedReason");
    }

    [Fact]
    public void Cg026_docs_record_audit_csv_career_gate()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-026");
        docs.Should().Contain("audit CSV");
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
