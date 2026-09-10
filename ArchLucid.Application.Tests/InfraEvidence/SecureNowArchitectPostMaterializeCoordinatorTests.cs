using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowArchitectPostMaterializeCoordinatorTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid SnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid PriorSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    private const string SubscriptionId = "11111111-1111-1111-1111-111111111111";

    [Fact]
    public async Task OnSnapshotMaterializedAsync_incremental_mode_skips_full_path_engines()
    {
        Mock<IPrivilegePathEngine> privilegePathEngine = new();
        Mock<IIntendedReachabilityEngine> reachabilityEngine = new();
        Mock<IToxicCombinationEngine> toxicEngine = new();
        Mock<ICapabilityToFlowEngine> capabilityEngine = new();
        Mock<ISharedControlBlastRadiusEngine> sharedEngine = new();
        Mock<IFourRealityDriftEngine> driftEngine = new();
        Mock<IPathRankingEngine> rankingEngine = new();
        Mock<ICutPointAnalysisEngine> cutPointEngine = new();
        Mock<ISecureNowArchitectNeighborhoodRunner> neighborhoodRunner = new();

        neighborhoodRunner
            .Setup(runner => runner.CarryForwardAllAsync(
                Scope,
                PriorSnapshotId,
                SnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);

        AzureInventorySnapshotPostMaterializeCoordinator sut = CreateCoordinator(
            fullRecompute: false,
            hasPrior: true,
            emptyDiff: true,
            privilegePathEngine,
            reachabilityEngine,
            toxicEngine,
            capabilityEngine,
            sharedEngine,
            driftEngine,
            rankingEngine,
            cutPointEngine,
            neighborhoodRunner);

        await sut.OnSnapshotMaterializedAsync(Scope, SnapshotId, SubscriptionId, CancellationToken.None);

        privilegePathEngine.Verify(
            engine => engine.RunAsync(
                Scope,
                SnapshotId,
                SecureNowArchitectConstants.SystemActorId,
                It.IsAny<CancellationToken>(),
                It.IsAny<SecureNowArchitectEngineRunScope?>()),
            Times.Never);

        driftEngine.Verify(
            engine => engine.RunAsync(
                Scope,
                SnapshotId,
                SecureNowArchitectConstants.SystemActorId,
                It.IsAny<CancellationToken>()),
            Times.Once);

        neighborhoodRunner.Verify(
            runner => runner.CarryForwardAllAsync(Scope, PriorSnapshotId, SnapshotId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task OnSnapshotMaterializedAsync_full_recompute_runs_all_engines()
    {
        Mock<IPrivilegePathEngine> privilegePathEngine = new();
        Mock<IIntendedReachabilityEngine> reachabilityEngine = new();
        Mock<IToxicCombinationEngine> toxicEngine = new();
        Mock<ICapabilityToFlowEngine> capabilityEngine = new();
        Mock<ISharedControlBlastRadiusEngine> sharedEngine = new();
        Mock<IFourRealityDriftEngine> driftEngine = new();
        Mock<IPathRankingEngine> rankingEngine = new();
        Mock<ICutPointAnalysisEngine> cutPointEngine = new();
        Mock<ISecureNowArchitectNeighborhoodRunner> neighborhoodRunner = new();

        SetupSuccessfulEngine(privilegePathEngine);
        SetupSuccessfulEngine(reachabilityEngine);
        SetupSuccessfulEngine(toxicEngine);
        SetupSuccessfulEngine(capabilityEngine);
        SetupSuccessfulEngine(sharedEngine);
        SetupSuccessfulEngine(driftEngine);
        SetupSuccessfulRankingEngine(rankingEngine);
        SetupSuccessfulCutPointEngine(cutPointEngine);

        AzureInventorySnapshotPostMaterializeCoordinator sut = CreateCoordinator(
            fullRecompute: true,
            hasPrior: true,
            emptyDiff: false,
            privilegePathEngine,
            reachabilityEngine,
            toxicEngine,
            capabilityEngine,
            sharedEngine,
            driftEngine,
            rankingEngine,
            cutPointEngine,
            neighborhoodRunner);

        await sut.OnSnapshotMaterializedAsync(Scope, SnapshotId, SubscriptionId, CancellationToken.None);

        privilegePathEngine.Verify(
            engine => engine.RunAsync(
                Scope,
                SnapshotId,
                SecureNowArchitectConstants.SystemActorId,
                It.IsAny<CancellationToken>(),
                It.IsAny<SecureNowArchitectEngineRunScope?>()),
            Times.Once);

        capabilityEngine.Verify(
            engine => engine.RunAsync(
                Scope,
                SnapshotId,
                SecureNowArchitectConstants.SystemActorId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static AzureInventorySnapshotPostMaterializeCoordinator CreateCoordinator(
        bool fullRecompute,
        bool hasPrior,
        bool emptyDiff,
        Mock<IPrivilegePathEngine> privilegePathEngine,
        Mock<IIntendedReachabilityEngine> reachabilityEngine,
        Mock<IToxicCombinationEngine> toxicEngine,
        Mock<ICapabilityToFlowEngine> capabilityEngine,
        Mock<ISharedControlBlastRadiusEngine> sharedEngine,
        Mock<IFourRealityDriftEngine> driftEngine,
        Mock<IPathRankingEngine> rankingEngine,
        Mock<ICutPointAnalysisEngine> cutPointEngine,
        Mock<ISecureNowArchitectNeighborhoodRunner> neighborhoodRunner)
    {
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();

        if (hasPrior)
        {
            snapshotRepository
                .Setup(repository => repository.TryGetPriorMaterializedSnapshotIdAsync(
                    Scope,
                    SubscriptionId,
                    SnapshotId,
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(PriorSnapshotId);
        }

        Mock<IAzureInventoryDiffService> diffService = new();

        if (hasPrior)
        {
            diffService
                .Setup(service => service.ComputeAndPersistDiffAsync(
                    Scope,
                    PriorSnapshotId,
                    SnapshotId,
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new AzureInventoryDiffComputeResult
                {
                    Succeeded = true,
                    DiffId = Guid.NewGuid(),
                    Changes = emptyDiff ? [] : [new AzureInventoryChangeRecord()],
                    WasExisting = false,
                });
        }

        IOptions<SecureNowArchitectNeighborhoodOptions> options = Options.Create(
            new SecureNowArchitectNeighborhoodOptions { FullRecompute = fullRecompute });

        return new AzureInventorySnapshotPostMaterializeCoordinator(
            snapshotRepository.Object,
            diffService.Object,
            options,
            neighborhoodRunner.Object,
            privilegePathEngine.Object,
            reachabilityEngine.Object,
            toxicEngine.Object,
            capabilityEngine.Object,
            sharedEngine.Object,
            driftEngine.Object,
            rankingEngine.Object,
            cutPointEngine.Object);
    }

    private static void SetupSuccessfulEngine(Mock<IPrivilegePathEngine> engine) =>
        engine.Setup(item => item.RunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<SecureNowArchitectEngineRunScope?>()))
            .ReturnsAsync(new PrivilegePathEngineResult { Succeeded = true });

    private static void SetupSuccessfulEngine(Mock<IIntendedReachabilityEngine> engine) =>
        engine.Setup(item => item.RunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<SecureNowArchitectEngineRunScope?>()))
            .ReturnsAsync(new PrivilegePathEngineResult { Succeeded = true });

    private static void SetupSuccessfulEngine(Mock<IToxicCombinationEngine> engine) =>
        engine.Setup(item => item.RunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<SecureNowArchitectEngineRunScope?>()))
            .ReturnsAsync(new PrivilegePathEngineResult { Succeeded = true });

    private static void SetupSuccessfulEngine(Mock<ICapabilityToFlowEngine> engine) =>
        engine.Setup(item => item.RunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PrivilegePathEngineResult { Succeeded = true });

    private static void SetupSuccessfulEngine(Mock<ISharedControlBlastRadiusEngine> engine) =>
        engine.Setup(item => item.RunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PrivilegePathEngineResult { Succeeded = true });

    private static void SetupSuccessfulEngine(Mock<IFourRealityDriftEngine> engine) =>
        engine.Setup(item => item.RunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PrivilegePathEngineResult { Succeeded = true });

    private static void SetupSuccessfulRankingEngine(Mock<IPathRankingEngine> engine) =>
        engine.Setup(item => item.RunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PathRankingEngineResult { Succeeded = true });

    private static void SetupSuccessfulCutPointEngine(Mock<ICutPointAnalysisEngine> engine) =>
        engine.Setup(item => item.RunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CutPointAnalysisEngineResult { Succeeded = true });
}
