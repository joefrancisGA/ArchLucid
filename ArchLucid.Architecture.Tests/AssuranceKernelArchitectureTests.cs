using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>Structural boundaries for the assurance truth/decision kernels.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AssuranceKernelArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void SecureNow_truth_kernel_has_no_llm_dependency()
    {
        string[] relativePaths =
        [
            "ArchLucid.Application/InfraEvidence/SecureNowArchitect/PrivilegePathEnumerator.cs",
            "ArchLucid.Application/InfraEvidence/SecureNowArchitect/IntendedReachabilityPathEnumerator.cs",
            "ArchLucid.Application/InfraEvidence/SecureNowArchitect/SecurityEvidenceCutPointAnalyzer.cs",
            "ArchLucid.Core/InfraEvidence/SecurityEvidencePathGuard.cs",
            "ArchLucid.Core/InfraEvidence/SecurityEvidencePathCanonicalHash.cs",
        ];

        string[] forbidden =
        [
            "AgentCompletion",
            "AzureOpenAI",
            "ChatCompletion",
            "IChat",
            "PromptTemplate",
            "AiInference",
        ];

        foreach (string relativePath in relativePaths)
        {
            string fullPath = Path.Combine(RepoRoot, relativePath.Replace('/', Path.DirectorySeparatorChar));
            File.Exists(fullPath).Should().BeTrue($"missing truth-kernel file {relativePath}");

            string source = File.ReadAllText(fullPath);

            foreach (string token in forbidden)
            {
                source.Should().NotContain(token, $"{relativePath} is deterministic truth-kernel code");
            }
        }
    }

    [Fact]
    public void ArchLucid_decision_kernel_keeps_failure_and_provenance_guards()
    {
        string failureClassifier = Path.Combine(
            RepoRoot,
            "ArchLucid.Contracts",
            "Findings",
            "FindingEngineFailureCommitClassifier.cs");
        string provenanceValidator = Path.Combine(
            RepoRoot,
            "ArchLucid.Core",
            "Findings",
            "DecisionGradeFindingProvenanceValidator.cs");
        string checklistRouter = Path.Combine(
            RepoRoot,
            "ArchLucid.Core",
            "Findings",
            "FindingChecklistCoverageRouter.cs");

        File.Exists(failureClassifier).Should().BeTrue();
        File.Exists(provenanceValidator).Should().BeTrue();
        File.Exists(checklistRouter).Should().BeTrue();

        File.ReadAllText(failureClassifier).Should().Contain("IsCommitBlocking");
        File.ReadAllText(provenanceValidator).Should().Contain("Evidence");
        File.ReadAllText(checklistRouter).Should().Contain("ChecklistCoverage");
    }

    [Fact]
    public void Assurance_program_documents_truth_boundaries()
    {
        string[] docs =
        [
            "SECURENOW_TRUTH_KERNEL.md",
            "ARCHLUCID_DECISION_KERNEL.md",
            "ASSURANCE_ARCHITECTURE_REVIEW.md",
        ];

        foreach (string document in docs)
        {
            File.Exists(Path.Combine(RepoRoot, "docs", "assurance", document))
                .Should().BeTrue($"missing assurance boundary document {document}");
        }
    }
}
