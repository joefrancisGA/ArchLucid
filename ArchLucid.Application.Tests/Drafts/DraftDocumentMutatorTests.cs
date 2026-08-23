using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftDocumentMutatorTests
{
    [Fact]
    public void ApplyPatch_UpdatesBusinessOutcome_AndSyncTransparencyRecordsAssertedTrail()
    {
        DraftRequestDocument document = new()
        {
            FreeTextIntent = DraftIntakeTestIntents.ValidGrcWorkflow,
            ActorSet = new ActorSet
            {
                Actors =
                [
                    new ActorDescriptor
                    {
                        Kind = ActorKind.Human,
                        TrustOrigin = TrustOrigin.Internal,
                        Contract = InteractionContract.Sync,
                        Origin = ActorOrigin.Asserted,
                    },
                ],
            },
        };

        DraftDocumentMutator.ApplyPatch(
            document,
            new PatchDraftRequest { BusinessOutcome = "Faster audit prep" });
        DraftDocumentMutator.SyncTransparencyFromDocument(document);

        document.BusinessOutcome.Should().Be("Faster audit prep");
        document.TransparencyTrail.Asserted.Should().Contain(entry =>
            entry.Key == "businessOutcome" && entry.Value == "Faster audit prep");
    }

    [Fact]
    public void RecordAssertedAnswer_RecordsAssertedTrailEntry()
    {
        DraftRequestDocument document = new()
        {
            FreeTextIntent = DraftIntakeTestIntents.ValidGrcWorkflow,
        };
        const string questionKey = "must.cloud.target";

        DraftDocumentMutator.RecordAssertedAnswer(document, questionKey, "Azure");

        document.TransparencyTrail.Asserted.Should().Contain(entry =>
            entry.Key == $"answer.{questionKey}" && entry.Value == "Azure");
    }

    [Fact]
    public void RemoveSkippedQuestion_ClearsMatchingSkipEntry()
    {
        DraftRequestDocument document = new()
        {
            FreeTextIntent = DraftIntakeTestIntents.ValidGrcWorkflow,
        };
        const string questionKey = "must.cloud.target";

        DraftDocumentMutator.UpsertSkipped(document, questionKey, ElicitationQuestionTier.Must);
        DraftDocumentMutator.RemoveSkippedQuestion(document, questionKey);

        document.TransparencyTrail.Skipped.Should().BeEmpty();
    }

    [Fact]
    public void NormalizeWorkflowIntent_ReturnsCanonicalValues()
    {
        DraftDocumentMutator.NormalizeWorkflowIntent("create-architecture")
            .Should().Be(ArchitectureWorkflowIntent.CreateArchitecture);
        DraftDocumentMutator.NormalizeWorkflowIntent("START-REVIEW")
            .Should().Be(ArchitectureWorkflowIntent.StartReview);
        DraftDocumentMutator.NormalizeWorkflowIntent("unknown").Should().BeNull();
    }
}
