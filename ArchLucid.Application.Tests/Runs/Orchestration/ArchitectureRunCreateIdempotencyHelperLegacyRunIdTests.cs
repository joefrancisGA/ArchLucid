using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class ArchitectureRunCreateIdempotencyHelperLegacyRunIdTests
{
    [Fact]
    public async Task CompareQuality_TryReplayFromIdempotencyAsync_rehydrates_tasks_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string runIdN = runGuid.ToString("N");
        string legacyUpper = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runIdN).ToUpperInvariant();

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        RunRecord runRecord = new()
        {
            RunId = runGuid,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ArchitectureRequestId = "REQ-IDEM",
        };

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(runRecord);

        const string bundleId = "bundle-idem-legacy";
        InMemoryAgentTaskRepository taskRepository = new();
        await taskRepository.CreateManyAsync(
            [
                new AgentTask
                {
                    TaskId = "legacy-idem-task",
                    RunId = legacyUpper,
                    AgentType = AgentType.Topology,
                    EvidenceBundleRef = bundleId,
                    CreatedUtc = DateTime.UtcNow,
                },
            ],
            CancellationToken.None);

        InMemoryEvidenceBundleRepository evidenceRepository = new();
        await evidenceRepository.CreateAsync(
            new EvidenceBundle
            {
                EvidenceBundleId = bundleId,
                RequestDescription = "desc",
            },
            CancellationToken.None);

        byte[] keyHash = [0x01, 0x02, 0x03];
        byte[] fingerprint = [0x04, 0x05, 0x06];
        InMemoryArchitectureRunIdempotencyRepository idempotencyRepository = new();
        await idempotencyRepository.TryInsertAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            keyHash,
            fingerprint,
            runIdN,
            CancellationToken.None);

        ArchitectureRunCreateIdempotencyHelper helper = new(
            idempotencyRepository,
            runRepository.Object,
            scopeProvider.Object,
            taskRepository,
            evidenceRepository,
            Options.Create(new ArchitectureRunCreateOptions()),
            TimeProvider.System,
            NullLogger<ArchitectureRunCreateIdempotencyHelper>.Instance);

        CreateRunIdempotencyState state = new(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            keyHash,
            fingerprint);

        CreateRunResult? result = await helper.TryReplayFromIdempotencyAsync(state, CancellationToken.None);

        result.Should().NotBeNull();
        result!.IdempotentReplay.Should().BeTrue();
        result.Tasks.Should().ContainSingle(task => task.TaskId == "legacy-idem-task");
        result.EvidenceBundle.EvidenceBundleId.Should().Be(bundleId);
    }
}
