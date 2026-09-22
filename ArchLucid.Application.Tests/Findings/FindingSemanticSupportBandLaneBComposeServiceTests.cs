using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class FindingSemanticSupportBandLaneBComposeServiceTests
{
    [Fact]
    public async Task ApplyToAgentResultsAsync_does_not_block_when_traces_are_missing()
    {
        Mock<IAgentExecutionTraceRepository> traceRepository = new();
        traceRepository
            .Setup(static repo => repo.GetByRunIdAsync(It.IsAny<ScopeContext>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        FindingSemanticSupportBandLaneBComposeService service = new(
            traceRepository.Object,
            Mock.Of<IAgentEvidencePackageRepository>(),
            Mock.Of<IAgentResultEvidenceFaithfulnessChecker>());

        ArchitectureFinding finding = new()
        {
            FindingId = "finding-1",
            Classification = FindingClassification.DecisionGradeFinding,
            SemanticSupportBand = FindingSemanticSupportBand.Supported,
        };

        AgentResult result = new()
        {
            TaskId = "task-1",
            Findings = [finding],
        };

        await service.ApplyToAgentResultsAsync(
            "run-1",
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() },
            [result],
            CancellationToken.None);

        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Unchecked);
    }
}
