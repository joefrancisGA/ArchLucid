using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryDiffNarrativeServiceTests
{
    [Fact]
    public async Task TryBuildNarrativeAsync_empty_diff_skips_generation()
    {
        Guid diffId = Guid.NewGuid();
        ScopeContext scope = new();

        Mock<IAzureInventoryDriftClassificationService> drift = new();
        drift
            .Setup(s => s.TryGetDriftReportAsync(scope, diffId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventoryDriftReportRecord
            {
                Summary = new AzureInventoryDiffSummaryRecord
                {
                    DiffId = diffId,
                    TotalChanges = 0,
                },
                Changes = [],
            });

        Mock<IAgentCompletionClient> llm = new();
        Mock<IPromptRedactor> redactor = new();

        AzureInventoryDiffNarrativeService sut = new(
            drift.Object,
            new NoOpAzureInventoryDiffNarrativeRepository(),
            llm.Object,
            redactor.Object,
            NullLogger<AzureInventoryDiffNarrativeService>.Instance);

        AzureInventoryDiffNarrativeResult result = await sut.TryBuildNarrativeAsync(
            scope,
            diffId,
            AzureInventoryDiffNarrativeKind.Material,
            useSimulator: false);

        result.Succeeded.Should().BeFalse();
        llm.Verify(
            c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryBuildNarrativeAsync_simulator_citations_are_subset_of_change_ids()
    {
        Guid diffId = Guid.NewGuid();
        Guid citedChangeId = Guid.NewGuid();
        Guid otherChangeId = Guid.NewGuid();
        ScopeContext scope = new();

        Mock<IAzureInventoryDriftClassificationService> drift = new();
        drift
            .Setup(s => s.TryGetDriftReportAsync(scope, diffId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventoryDriftReportRecord
            {
                Summary = new AzureInventoryDiffSummaryRecord
                {
                    DiffId = diffId,
                    TotalChanges = 2,
                },
                Changes =
                [
                    new()
                    {
                        Change = BuildChange(citedChangeId, AzureInventoryChangeType.NetworkExposureChanged),
                        Classification = AzureInventoryDriftClassification.SecurityRelevant,
                    },
                    new()
                    {
                        Change = BuildChange(otherChangeId, AzureInventoryChangeType.ResourceAdded),
                        Classification = AzureInventoryDriftClassification.ArchitectureRelevant,
                    },
                ],
            });

        CapturingNarrativeRepository narrativeRepository = new();

        AzureInventoryDiffNarrativeService sut = new(
            drift.Object,
            narrativeRepository,
            Mock.Of<IAgentCompletionClient>(),
            Mock.Of<IPromptRedactor>(),
            NullLogger<AzureInventoryDiffNarrativeService>.Instance);

        AzureInventoryDiffNarrativeResult result = await sut.TryBuildNarrativeAsync(
            scope,
            diffId,
            AzureInventoryDiffNarrativeKind.Security,
            useSimulator: true);

        result.Succeeded.Should().BeTrue();
        result.Narrative.Should().NotBeNull();
        result.Narrative!.CitedChangeIds.Should().OnlyContain(id => id == citedChangeId);
        result.Narrative.CitedChangeIds.Should().BeSubsetOf(new[] { citedChangeId, otherChangeId });
        result.Narrative.SimulatorLabel.Should().Be(AzureInventoryDiffNarrativeBuilder.SimulatorLabel);
    }

    [Fact]
    public async Task TryBuildNarrativeAsync_llm_path_invokes_redactor()
    {
        Guid diffId = Guid.NewGuid();
        Guid changeId = Guid.NewGuid();
        ScopeContext scope = new();

        Mock<IAzureInventoryDriftClassificationService> drift = new();
        drift
            .Setup(s => s.TryGetDriftReportAsync(scope, diffId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventoryDriftReportRecord
            {
                Summary = new AzureInventoryDiffSummaryRecord
                {
                    DiffId = diffId,
                    TotalChanges = 1,
                },
                Changes =
                [
                    new()
                    {
                        Change = BuildChange(changeId, AzureInventoryChangeType.PermissionChanged),
                        Classification = AzureInventoryDriftClassification.SecurityRelevant,
                    },
                ],
            });

        Mock<IAgentCompletionClient> llm = new();
        llm
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("Narrative citing change.");

        Mock<IPromptRedactor> redactor = new();
        redactor
            .Setup(r => r.Redact(It.IsAny<string?>()))
            .Returns((string? input) => new PromptRedactionOutcome(input ?? string.Empty, new Dictionary<string, int>()));

        AzureInventoryDiffNarrativeService sut = new(
            drift.Object,
            new NoOpAzureInventoryDiffNarrativeRepository(),
            llm.Object,
            redactor.Object,
            NullLogger<AzureInventoryDiffNarrativeService>.Instance);

        AzureInventoryDiffNarrativeResult result = await sut.TryBuildNarrativeAsync(
            scope,
            diffId,
            AzureInventoryDiffNarrativeKind.Security,
            useSimulator: false);

        result.Succeeded.Should().BeTrue();
        redactor.Verify(r => r.Redact(It.IsAny<string?>()), Times.Once);
    }

    private static AzureInventoryChangeRecord BuildChange(Guid changeId, AzureInventoryChangeType changeType) =>
        new()
        {
            ChangeId = changeId,
            DiffId = Guid.NewGuid(),
            SnapshotAId = Guid.NewGuid(),
            SnapshotBId = Guid.NewGuid(),
            ChangeType = changeType,
            ProvenanceKind = ProvenanceKind.ObservedFact,
        };

    private sealed class CapturingNarrativeRepository : IAzureInventoryDiffNarrativeRepository
    {
        public Task InsertAsync(AzureInventoryDiffNarrativeRecord record, CancellationToken cancellationToken = default)
        {
            LastInserted = record;
            return Task.CompletedTask;
        }

        public AzureInventoryDiffNarrativeRecord? LastInserted
        {
            get;
            private set;
        }

        public Task<IReadOnlyList<AzureInventoryDiffNarrativeRecord>> ListByDiffIdAsync(
            ScopeContext scope,
            Guid diffId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AzureInventoryDiffNarrativeRecord>>([]);
    }
}
