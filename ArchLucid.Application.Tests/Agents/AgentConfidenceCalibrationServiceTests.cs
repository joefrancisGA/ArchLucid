using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentConfidenceCalibrationServiceTests
{
    [Fact]
    public async Task ApplyCalibratedConfidenceForRunAsync_uses_finding_source_agent_when_envelope_agent_type_missing()
    {
        AgentResult result = new()
        {
            ResultId = "result-1",
            TaskId = "task-1",
            RunId = "run-1",
            Confidence = 0.73,
            Findings =
            [
                new ArchitectureFinding
                {
                    SourceAgent = AgentType.Topology,
                    FindingId = "finding-1",
                    Message = "Review peering.",
                    Category = "Network",
                    Severity = FindingSeverity.Info,
                },
            ],
        };

        result.AgentType.Should().Be(default(AgentType));

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), "run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync([result]);

        Mock<IAgentResultEnrichmentRepository> enrichmentRepository = new();
        enrichmentRepository
            .Setup(r => r.UpsertCalibratedConfidenceAsync(
                It.IsAny<string>(),
                It.IsAny<double>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAgentConfidenceCalibrator> calibrator = new();
        calibrator
            .Setup(c => c.CalibrateAsync(
                AgentType.Topology,
                0.73,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(0.55);

        Mock<IScopeContextProvider> scopeContextProvider = new();
        scopeContextProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        AgentConfidenceCalibrationService sut = new(
            resultRepository.Object,
            enrichmentRepository.Object,
            scopeContextProvider.Object,
            calibrator.Object,
            Options.Create(new AgentConfidenceCalibrationOptions { Enabled = true }),
            NullLogger<AgentConfidenceCalibrationService>.Instance);

        await sut.ApplyCalibratedConfidenceForRunAsync("run-1", CancellationToken.None);

        calibrator.Verify(
            c => c.CalibrateAsync(AgentType.Topology, 0.73, It.IsAny<CancellationToken>()),
            Times.Once);
        enrichmentRepository.Verify(
            r => r.UpsertCalibratedConfidenceAsync("result-1", 0.55, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ApplyCalibratedConfidenceForRunAsync_skips_null_result_entries()
    {
        AgentResult retained = new()
        {
            ResultId = "result-1",
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            Confidence = 0.5,
        };

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), "run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync([null!, retained]);

        Mock<IAgentResultEnrichmentRepository> enrichmentRepository = new();
        enrichmentRepository
            .Setup(r => r.UpsertCalibratedConfidenceAsync(
                It.IsAny<string>(),
                It.IsAny<double>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAgentConfidenceCalibrator> calibrator = new();
        calibrator
            .Setup(c => c.CalibrateAsync(
                AgentType.Topology,
                0.5,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(0.4);

        Mock<IScopeContextProvider> scopeContextProvider = new();
        scopeContextProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        AgentConfidenceCalibrationService sut = new(
            resultRepository.Object,
            enrichmentRepository.Object,
            scopeContextProvider.Object,
            calibrator.Object,
            Options.Create(new AgentConfidenceCalibrationOptions { Enabled = true }),
            NullLogger<AgentConfidenceCalibrationService>.Instance);

        await sut.ApplyCalibratedConfidenceForRunAsync("run-1", CancellationToken.None);

        calibrator.Verify(
            c => c.CalibrateAsync(AgentType.Topology, 0.5, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
