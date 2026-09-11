using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class AuditExportCareerPostureGateTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid RunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    [Fact]
    public async Task ResolveForRunFilterAsync_WorkingCareerSimulator_is_blocked()
    {
        Mock<IRunDetailQueryService> runDetails = CreateRunDetails(
            StructuralExecutionMode.Simulator,
            WorkingCareerRehearsalDoorValues.Career);

        AuditExportCareerPostureGateResult result = await AuditExportCareerPostureGate.ResolveForRunFilterAsync(
            RunId,
            Scope,
            runDetails.Object,
            CreateAuthority().Object,
            Mock.Of<IGraphSnapshotRepository>(),
            SealedExportReceiptTestSupport.CreateEmptyAgentExecutionTraceRepository(),
            SealedExportReceiptTestSupport.CreateSuccessfulExportHonestyConfiguration(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureInventoryBindingRepository>(),
            CancellationToken.None);

        result.IsBlocked.Should().BeTrue();
        result.BlockReasonCode.Should().Be(CareerArtifactCompletenessValidator.SimulatorRehearsalCode);
        result.Stamp.Should().BeNull();
    }

    [Fact]
    public async Task ResolveForRunFilterAsync_WorkingRehearsalSimulator_stamps_posture()
    {
        Mock<IRunDetailQueryService> runDetails = CreateRunDetails(
            StructuralExecutionMode.Simulator,
            WorkingCareerRehearsalDoorValues.Rehearsal);

        AuditExportCareerPostureGateResult result = await AuditExportCareerPostureGate.ResolveForRunFilterAsync(
            RunId,
            Scope,
            runDetails.Object,
            CreateAuthority().Object,
            Mock.Of<IGraphSnapshotRepository>(),
            SealedExportReceiptTestSupport.CreateEmptyAgentExecutionTraceRepository(),
            SealedExportReceiptTestSupport.CreateSuccessfulExportHonestyConfiguration(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureInventoryBindingRepository>(),
            CancellationToken.None);

        result.IsBlocked.Should().BeFalse();
        result.Stamp.Should().NotBeNull();
        result.Stamp!.StructuralExecutionMode.Should().Be(nameof(StructuralExecutionMode.Simulator));
        result.Stamp.WorkingCareerRehearsalDoor.Should().Be(WorkingCareerRehearsalDoorValues.Rehearsal);
        result.Stamp.RehearsalIncomplete.Should().BeTrue();
    }

    private static Mock<IRunDetailQueryService> CreateRunDetails(
        StructuralExecutionMode mode,
        string door)
    {
        Mock<IRunDetailQueryService> runDetails = new();

        runDetails
            .Setup(s => s.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = new ArchitectureRun
                {
                    RunId = RunId.ToString("N"),
                    Status = ArchitectureRunStatus.Committed,
                    StructuralExecutionMode = mode,
                    WorkingCareerRehearsalDoor = door,
                },
            });

        return runDetails;
    }

    private static Mock<IAuthorityQueryService> CreateAuthority()
    {
        Mock<IAuthorityQueryService> authority = new();

        authority
            .Setup(s => s.GetRunDetailForExportAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = RunId },
                FindingCoverageSummary = new RunFindingCoverageSummary { EnginesSucceeded = 50 },
            });

        return authority;
    }
}
