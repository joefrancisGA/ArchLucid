using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-025 ratchet: decision receipt JSON stamps execute Mode + door; rehearsal receipts are incomplete.
/// Does not reopen FC receipt body.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg025CareerBlocksDecisionReceiptArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg025_decision_receipt_service_stamps_posture_after_sealed_hash()
    {
        string service = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "DecisionReceiptService.cs"));
        string stamper = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "DecisionReceiptCareerPostureStamper.cs"));

        service.Should().Contain("DecisionReceiptCareerPostureStamper.ApplyCommittedRunPosture");
        stamper.Should().Contain("RehearsalIncomplete");
        stamper.Should().Contain("WorkingCareerRehearsalDoor");
        stamper.Should().Contain("StructuralExecutionMode");
    }

    [Fact]
    public void Cg025_decision_receipt_contract_requires_posture_fields()
    {
        string contract = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Exports", "DecisionReceiptDocument.cs"));

        contract.Should().Contain("StructuralExecutionMode");
        contract.Should().Contain("WorkingCareerRehearsalDoor");
        contract.Should().Contain("RehearsalIncomplete");
    }

    [Fact]
    public void Cg025_ts_helper_includes_career_posture_on_committed_run()
    {
        string exportHelper = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "decision-receipt-export.ts"));
        string postureHelper = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "decision-receipt-career-posture.ts"));

        exportHelper.Should().Contain("resolveDecisionReceiptCareerPosture");
        exportHelper.Should().Contain("careerPosture");
        postureHelper.Should().Contain("rehearsalIncomplete");
    }

    [Fact]
    public void Cg025_docs_record_decision_receipt_career_gate()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-025");
        docs.Should().Contain("decision receipt");
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
