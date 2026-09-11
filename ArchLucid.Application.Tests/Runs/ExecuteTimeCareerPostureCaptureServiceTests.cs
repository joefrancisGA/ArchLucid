using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExecuteTimeCareerPostureCaptureServiceTests
{
    [Fact]
    public async Task TryCaptureAndPersistAsync_stamps_door_and_captured_utc_on_first_execute()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        ScopeContext scope = Scope(tenantId, workspaceId, projectId);
        RunRecord header = Header(runId, tenantId, workspaceId, projectId);

        Mock<IRunRepository> runs = CreateRuns(scope, runId, header);
        Mock<IWorkingCareerRehearsalDoorReader> doors = new();
        doors
            .Setup(s => s.TryGetStoredDoorAsync("jwt:operator", It.IsAny<CancellationToken>()))
            .ReturnsAsync(WorkingCareerRehearsalDoorValues.Rehearsal);

        ExecuteTimeCareerPostureCaptureService sut = CreateSut(runs.Object, scope, doors.Object);

        await sut.TryCaptureAndPersistAsync(runId.ToString("N"), CancellationToken.None);

        header.WorkingCareerRehearsalDoor.Should().Be(WorkingCareerRehearsalDoorValues.Rehearsal);
        header.ExecutePostureCapturedUtc.Should().NotBeNull();
        header.ExecutePostureCapturedUtc!.Value.Kind.Should().Be(DateTimeKind.Utc);
        runs.Verify(r => r.UpdateAsync(header, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task TryCaptureAndPersistAsync_is_idempotent_when_captured_utc_is_already_set()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        ScopeContext scope = Scope(tenantId, workspaceId, projectId);
        DateTime originalUtc = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        RunRecord header = Header(runId, tenantId, workspaceId, projectId);
        header.WorkingCareerRehearsalDoor = WorkingCareerRehearsalDoorValues.Rehearsal;
        header.ExecutePostureCapturedUtc = originalUtc;

        Mock<IRunRepository> runs = CreateRuns(scope, runId, header);
        Mock<IWorkingCareerRehearsalDoorReader> doors = new();
        doors
            .Setup(s => s.TryGetStoredDoorAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(WorkingCareerRehearsalDoorValues.Career);

        ExecuteTimeCareerPostureCaptureService sut = CreateSut(runs.Object, scope, doors.Object);

        await sut.TryCaptureAndPersistAsync(runId.ToString("N"), CancellationToken.None);

        header.WorkingCareerRehearsalDoor.Should().Be(WorkingCareerRehearsalDoorValues.Rehearsal);
        header.ExecutePostureCapturedUtc.Should().Be(originalUtc);
        runs.Verify(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()), Times.Never);
        doors.Verify(s => s.TryGetStoredDoorAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task TryCaptureAndPersistAsync_does_not_mutate_pre_sealed_runs()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        ScopeContext scope = Scope(tenantId, workspaceId, projectId);
        RunRecord header = Header(runId, tenantId, workspaceId, projectId);
        header.GoldenManifestId = Guid.NewGuid();

        Mock<IRunRepository> runs = CreateRuns(scope, runId, header);
        Mock<IWorkingCareerRehearsalDoorReader> doors = new();

        ExecuteTimeCareerPostureCaptureService sut = CreateSut(runs.Object, scope, doors.Object);

        await sut.TryCaptureAndPersistAsync(runId.ToString("N"), CancellationToken.None);

        header.WorkingCareerRehearsalDoor.Should().BeNull();
        header.ExecutePostureCapturedUtc.Should().BeNull();
        runs.Verify(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()), Times.Never);
        doors.Verify(s => s.TryGetStoredDoorAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task TryCaptureAndPersistAsync_defaults_unset_door_to_career()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        ScopeContext scope = Scope(tenantId, workspaceId, projectId);
        RunRecord header = Header(runId, tenantId, workspaceId, projectId);

        Mock<IRunRepository> runs = CreateRuns(scope, runId, header);
        Mock<IWorkingCareerRehearsalDoorReader> doors = new();
        doors
            .Setup(s => s.TryGetStoredDoorAsync("jwt:operator", It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        ExecuteTimeCareerPostureCaptureService sut = CreateSut(runs.Object, scope, doors.Object);

        await sut.TryCaptureAndPersistAsync(runId.ToString("N"), CancellationToken.None);

        header.WorkingCareerRehearsalDoor.Should().Be(WorkingCareerRehearsalDoorValues.Career);
        header.ExecutePostureCapturedUtc.Should().NotBeNull();
    }

    private static ExecuteTimeCareerPostureCaptureService CreateSut(
        IRunRepository runs,
        ScopeContext scope,
        IWorkingCareerRehearsalDoorReader doors)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActorId()).Returns("jwt:operator");

        return new ExecuteTimeCareerPostureCaptureService(
            runs,
            scopeProvider.Object,
            doors,
            actor.Object);
    }

    private static Mock<IRunRepository> CreateRuns(ScopeContext scope, Guid runId, RunRecord header)
    {
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        runs
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return runs;
    }

    private static ScopeContext Scope(Guid tenantId, Guid workspaceId, Guid projectId) =>
        new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId
        };

    private static RunRecord Header(Guid runId, Guid tenantId, Guid workspaceId, Guid projectId) =>
        new()
        {
            RunId = runId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ScopeProjectId = projectId,
            ProjectId = projectId.ToString("N")
        };
}
