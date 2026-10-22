using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ExecuteEvidenceReadinessEvaluatorTests
{
    [Fact]
    public void IsReadyForExecute_returns_true_when_operator_brief_is_long_enough()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-1",
            Description = new string('x', QuickStartAnalyzableEvidenceCompleteness.MinOperatorBriefCharacters),
            SystemName = "Sys",
            Environment = "prod",
        };

        ExecuteEvidenceReadinessEvaluator.IsReadyForExecute(request, null).Should().BeTrue();
    }

    [Fact]
    public void IsReadyForExecute_returns_false_when_pending_files_never_uploaded()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-2",
            Description = "short",
            SystemName = "Sys",
            Environment = "prod",
            IntakeQuestionAnswers = new Dictionary<string, string>
            {
                [QuickStartIntakeMetadataKeys.PendingEvidenceFileNamesKey] = "inventory.json",
            },
        };

        ExecuteEvidenceReadinessEvaluator.IsReadyForExecute(request, new EvidenceBundle()).Should().BeFalse();
    }

    [Fact]
    public void IsReadyForExecute_returns_true_when_bulk_evidence_metadata_present()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-3",
            Description = "short",
            SystemName = "Sys",
            Environment = "prod",
            IntakeQuestionAnswers = new Dictionary<string, string>
            {
                [QuickStartIntakeMetadataKeys.PendingEvidenceFileNamesKey] = "inventory.json",
            },
        };

        EvidenceBundle bundle = new()
        {
            Metadata = new Dictionary<string, string>
            {
                [BulkEvidenceMetadataKeys.AttachedFileCountKey] = "2",
            },
        };

        ExecuteEvidenceReadinessEvaluator.IsReadyForExecute(request, bundle).Should().BeTrue();
    }
}
