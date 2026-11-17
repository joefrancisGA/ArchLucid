using ArchLucid.Application.Analysis;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class ExecuteEvidenceReadinessGateLegacyRunIdTests
{
    [Fact]
    public async Task CompareQuality_EnsureReadyAsync_succeeds_when_task_bundle_ref_uses_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("13131313-1313-1313-1313-131313131313");
        string runIdN = runGuid.ToString("N");
        string legacyUpper = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runIdN).ToUpperInvariant();

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        ArchitectureRequest request = new()
        {
            RequestId = "REQ-EVIDENCE-GATE",
            SystemName = "GateSystem",
            Description = "short",
            Environment = "prod",
        };

        RunRecord runRecord = new()
        {
            RunId = runGuid,
            ArchitectureRequestId = request.RequestId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
        };

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(runRecord);

        Mock<IArchitectureRequestRepository> requestRepository = new();
        requestRepository
            .Setup(r => r.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        const string bundleId = "bundle-gate-legacy";
        EvidenceBundle bundle = new()
        {
            EvidenceBundleId = bundleId,
            RequestDescription = "short",
            Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [BulkEvidenceMetadataKeys.AttachedFileCountKey] = "1",
            },
        };

        InMemoryEvidenceBundleRepository evidenceBundleRepository = new();
        await evidenceBundleRepository.CreateAsync(bundle, CancellationToken.None);

        InMemoryAgentTaskRepository taskRepository = new();
        await taskRepository.CreateManyAsync(
            [
                new AgentTask
                {
                    TaskId = "legacy-gate-task",
                    RunId = legacyUpper,
                    AgentType = AgentType.Topology,
                    EvidenceBundleRef = bundleId,
                    CreatedUtc = DateTime.UtcNow,
                },
            ],
            CancellationToken.None);

        ExecuteEvidenceReadinessGate gate = new(
            scopeProvider.Object,
            runRepository.Object,
            requestRepository.Object,
            taskRepository,
            evidenceBundleRepository);

        Func<Task> act = () => gate.EnsureReadyAsync(runIdN, CancellationToken.None);

        await act.Should().NotThrowAsync();
    }
}
