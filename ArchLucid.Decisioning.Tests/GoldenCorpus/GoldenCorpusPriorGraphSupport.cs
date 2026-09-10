using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Models;

using Moq;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

internal static class GoldenCorpusPriorGraphSupport
{
    internal static (
        IGraphSnapshotRepository GraphSnapshotRepository,
        FindingAnalysisContext AnalysisContext) CreatePriorFixture(
        Guid runId,
        Guid contextSnapshotId,
        GoldenCorpusPriorGraphFixtureDocument priorFixture,
        FindingAnalysisContext? existingContext)
    {
        ArgumentNullException.ThrowIfNull(priorFixture);

        if (priorFixture.PriorRunId == Guid.Empty)
        {
            throw new InvalidOperationException("Golden corpus prior graph fixture requires priorRunId.");
        }

        if (priorFixture.PriorGraphSnapshotId == Guid.Empty)
        {
            throw new InvalidOperationException("Golden corpus prior graph fixture requires priorGraphSnapshotId.");
        }

        ScopeContext scope = GoldenCorpusFixedScopeContextProvider.Scope;

        Mock<IGraphSnapshotRepository> graphSnapshotRepository = new();
        graphSnapshotRepository
            .Setup(repository => repository.GetByIdAsync(
                scope,
                priorFixture.PriorGraphSnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(priorFixture.PriorGraphSnapshot);

        PriorReviewSnapshots prior = new()
        {
            PriorRunId = priorFixture.PriorRunId,
            PriorGraphSnapshotId = priorFixture.PriorGraphSnapshotId,
        };

        FindingAnalysisContext analysisContext = existingContext is null
            ? new FindingAnalysisContext
            {
                RunId = runId,
                ContextSnapshotId = contextSnapshotId,
                Prior = prior,
            }
            : new FindingAnalysisContext
            {
                RunId = existingContext.RunId,
                ContextSnapshotId = existingContext.ContextSnapshotId,
                ArchitectureVersionId = existingContext.ArchitectureVersionId,
                EnabledPolicyPackIds = existingContext.EnabledPolicyPackIds,
                ContextCanonicalFingerprint = existingContext.ContextCanonicalFingerprint,
                KnowledgeModelFingerprint = existingContext.KnowledgeModelFingerprint,
                RequiredFindingCategories = existingContext.RequiredFindingCategories,
                RequiredEngineTypes = existingContext.RequiredEngineTypes,
                EvidencePin = existingContext.EvidencePin,
                EvidencePins = existingContext.EvidencePins,
                HasCreateTimeEvidencePinCommitment = existingContext.HasCreateTimeEvidencePinCommitment,
                HeldCheckLedger = existingContext.HeldCheckLedger,
                Prior = prior,
            };

        return (graphSnapshotRepository.Object, analysisContext);
    }
}
