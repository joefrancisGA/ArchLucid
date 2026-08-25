using ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.Ports;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration.Pipeline;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityPipelineDecisioningStageTests
{
    [SkippableFact]
    public void EnforceFindingsReadyForDecisioning_throws_when_generation_failed()
    {
        Guid runId = Guid.NewGuid();
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = runId,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            GenerationStatus = FindingsSnapshotGenerationStatus.Failed
        };

        AuthorityPipelineDecisioningStage sut = CreateSut(new AuthorityPipelineOptions());

        Action act = () => sut.EnforceFindingsReadyForDecisioning(snapshot, runId);

        act.Should().Throw<InvalidOperationException>().WithMessage("*failed for all engines*");
    }

    [SkippableFact]
    public void EnforceFindingsReadyForDecisioning_throws_when_partial_and_halt_enabled()
    {
        Guid runId = Guid.NewGuid();
        DateTime utc = TimeProvider.System.UtcNowDateTime();
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = runId,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            CreatedUtc = utc,
            GenerationStatus = FindingsSnapshotGenerationStatus.PartiallyComplete,
            EngineFailures =
            [
                new FindingEngineFailure
                {
                    EngineType = "llm-engine",
                    Category = "Test",
                    ErrorMessage = "circuit",
                    ExceptionType = nameof(InvalidOperationException),
                    DurationMs = 1,
                    OccurredUtc = utc
                }
            ]
        };

        AuthorityPipelineDecisioningStage sut = CreateSut(new AuthorityPipelineOptions { HaltOnPartialFindings = true });

        Action act = () => sut.EnforceFindingsReadyForDecisioning(snapshot, runId);

        act.Should().Throw<InvalidOperationException>().WithMessage("*only partially complete*");
    }

    [SkippableFact]
    public void EnforceFindingsReadyForDecisioning_allows_partial_when_halt_disabled_and_no_blocking_engine()
    {
        Guid runId = Guid.NewGuid();
        DateTime utc = TimeProvider.System.UtcNowDateTime();
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = runId,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            CreatedUtc = utc,
            GenerationStatus = FindingsSnapshotGenerationStatus.PartiallyComplete,
            EngineFailures =
            [
                new FindingEngineFailure
                {
                    EngineType = "llm-engine",
                    Category = "Test",
                    ErrorMessage = "circuit",
                    ExceptionType = nameof(InvalidOperationException),
                    DurationMs = 1,
                    OccurredUtc = utc
                }
            ]
        };

        AuthorityPipelineDecisioningStage sut = CreateSut(new AuthorityPipelineOptions { HaltOnPartialFindings = false });

        Action act = () => sut.EnforceFindingsReadyForDecisioning(snapshot, runId);

        act.Should().NotThrow();
    }

    [SkippableFact]
    public void EnforceFindingsReadyForDecisioning_blocks_security_engine_failure_even_when_halt_disabled()
    {
        Guid runId = Guid.NewGuid();
        DateTime utc = TimeProvider.System.UtcNowDateTime();
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = runId,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            CreatedUtc = utc,
            GenerationStatus = FindingsSnapshotGenerationStatus.PartiallyComplete,
            EngineFailures =
            [
                new FindingEngineFailure
                {
                    EngineType = "security-baseline",
                    Category = "Security",
                    ErrorMessage = "critical",
                    ExceptionType = nameof(InvalidOperationException),
                    DurationMs = 1,
                    OccurredUtc = utc
                }
            ]
        };

        AuthorityPipelineDecisioningStage sut = CreateSut(new AuthorityPipelineOptions { HaltOnPartialFindings = false });

        Action act = () => sut.EnforceFindingsReadyForDecisioning(snapshot, runId);

        act.Should().Throw<InvalidOperationException>().WithMessage("*only partially complete*");
    }

    private static AuthorityPipelineDecisioningStage CreateSut(AuthorityPipelineOptions options)
    {
        Mock<IOptionsMonitor<AuthorityPipelineOptions>> apPipeline = new();
        apPipeline.Setup(m => m.CurrentValue).Returns(options);

        return new AuthorityPipelineDecisioningStage(
            Mock.Of<IDecisionEngine>(),
            Mock.Of<IAuthorityPipelineStagePersistence>(),
            Mock.Of<IAuditService>(),
            Mock.Of<ArchLucid.Application.ArchitectureIntelligence.IAuthorityClosedLoopStrengtheningPass>(),
            apPipeline.Object,
            NullLogger<AuthorityPipelineDecisioningStage>.Instance);
    }
}
