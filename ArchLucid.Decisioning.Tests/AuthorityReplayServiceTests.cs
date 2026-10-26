using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Coordination.Replay;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// Unit tests for <see cref="AuthorityReplayService"/> covering the four top-level paths:
/// unknown run → null, ReconstructOnly (no writes), RebuildManifest (decision engine only),
/// and RebuildArtifacts (decision engine + artifact synthesis).
/// </summary>
[Trait("Category", "Unit")]
public sealed class AuthorityReplayServiceTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    private static RunDetailDto MakeDetailDto(Guid runId) => new()
    {
        Run = new RunRecord
        {
            RunId = runId,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ScopeProjectId = Guid.NewGuid()
        }
    };

    private static RunDetailDto MakeFullDetailDto(Guid runId)
    {
        RunDetailDto dto = MakeDetailDto(runId);
        dto.ContextSnapshot = new ContextSnapshot { SnapshotId = Guid.NewGuid() };
        dto.GraphSnapshot = new GraphSnapshot { GraphSnapshotId = Guid.NewGuid() };
        dto.FindingsSnapshot = new FindingsSnapshot { FindingsSnapshotId = Guid.NewGuid() };
        dto.GoldenManifest = new ManifestDocument
        {
            ManifestId = Guid.NewGuid(),
            RunId = runId,
            ManifestHash = "abc123",
            CreatedUtc = DateTime.UtcNow,
            RuleSetId = "rules",
            RuleSetVersion = "1",
            RuleSetHash = "rule-hash",
        };
        return dto;
    }

    private static (AuthorityReplayService Sut,
        Mock<IAuthorityQueryService> Query,
        Mock<IDecisionEngine> DecisionEngine,
        Mock<IArtifactSynthesisService> ArtifactSvc,
        Mock<IManifestHashService> HashSvc,
        Mock<ITechnologyLedgerRepository> LedgerRepo)
        Build(RunDetailDto? returnedDto = null)
    {
        Mock<IAuthorityQueryService> query = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IDecisionEngine> decisionEngine = new();
        Mock<IArtifactSynthesisService> artifactSvc = new();
        Mock<IManifestHashService> hashSvc = new();
        Mock<IDecisionTraceRepository> traceRepo = new();
        Mock<IGoldenManifestRepository> manifestRepo = new();
        Mock<IArtifactBundleRepository> artifactRepo = new();

        scopeProvider
            .Setup(x => x.GetCurrentScope())
            .Returns(new ScopeContext());

        query
            .Setup(x => x.GetRunDetailAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(returnedDto);

        hashSvc
            .Setup(x => x.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns("abc123");

        decisionEngine
            .Setup(x => x.DecideAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<GraphSnapshot>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((
                new ManifestDocument { ManifestId = Guid.NewGuid(), RunId = Guid.NewGuid() },
                RuleAuditTraceDto.From(new RuleAuditTracePayload { DecisionTraceId = Guid.NewGuid() })));

        traceRepo
            .Setup(x => x.SaveAsync(It.IsAny<DecisionTraceDto>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        manifestRepo
            .Setup(x => x.SaveAsync(It.IsAny<ManifestDocument>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        artifactSvc
            .Setup(x => x.SynthesizeAsync(It.IsAny<ManifestDocument>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArtifactBundle { BundleId = Guid.NewGuid() });
        artifactSvc
            .Setup(x => x.SynthesizeAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<IReadOnlyList<TechnologyLedgerEntry>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArtifactBundle { BundleId = Guid.NewGuid() });

        artifactRepo
            .Setup(x => x.SaveAsync(It.IsAny<ArtifactBundle>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITechnologyLedgerRepository> ledgerRepo = new();
        ledgerRepo
            .Setup(x => x.GetByRunIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        AuthorityReplayService sut = new(
            query.Object,
            scopeProvider.Object,
            decisionEngine.Object,
            artifactSvc.Object,
            hashSvc.Object,
            traceRepo.Object,
            manifestRepo.Object,
            artifactRepo.Object,
            ledgerRepo.Object);

        return (sut, query, decisionEngine, artifactSvc, hashSvc, ledgerRepo);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Unknown RunId → null
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ReplayAsync_UnknownRunId_ReturnsNull()
    {
        (AuthorityReplayService sut, _, _, _, _, _) = Build(returnedDto: null);

        ReplayResult? result = await sut.ReplayAsync(
            new ReplayRequest { RunId = Guid.NewGuid(), Mode = ReplayMode.ReconstructOnly },
            CancellationToken.None);

        result.Should().BeNull();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ReconstructOnly — no decision-engine or artifact calls
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ReplayAsync_ReconstructOnly_DoesNotCallDecisionEngine()
    {
        Guid runId = Guid.NewGuid();
        (AuthorityReplayService sut, _, Mock<IDecisionEngine> engine, Mock<IArtifactSynthesisService> artifactSvc, _, _)
            = Build(MakeDetailDto(runId));

        ReplayResult? result = await sut.ReplayAsync(
            new ReplayRequest { RunId = runId, Mode = ReplayMode.ReconstructOnly },
            CancellationToken.None);

        result.Should().NotBeNull();
        result.Mode.Should().Be(ReplayMode.ReconstructOnly);
        result.RebuiltManifest.Should().BeNull();
        engine.Verify(
            x => x.DecideAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<GraphSnapshot>(), It.IsAny<FindingsSnapshot>(), It.IsAny<CancellationToken>()),
            Times.Never);
        artifactSvc.Verify(
            x => x.SynthesizeAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<IReadOnlyList<TechnologyLedgerEntry>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // RebuildManifest — decision engine called, artifact synthesis NOT called
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ReplayAsync_RebuildManifest_CallsDecisionEngineButNotArtifactSynthesis()
    {
        Guid runId = Guid.NewGuid();
        (AuthorityReplayService sut, _, Mock<IDecisionEngine> engine, Mock<IArtifactSynthesisService> artifactSvc, _, _)
            = Build(MakeFullDetailDto(runId));

        ReplayResult? result = await sut.ReplayAsync(
            new ReplayRequest { RunId = runId, Mode = ReplayMode.RebuildManifest },
            CancellationToken.None);

        result.Should().NotBeNull();
        result.RebuiltManifest.Should().NotBeNull();
        result.RebuiltArtifactBundle.Should().BeNull();
        engine.Verify(
            x => x.DecideAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<GraphSnapshot>(), It.IsAny<FindingsSnapshot>(), It.IsAny<CancellationToken>()),
            Times.Once);
        artifactSvc.Verify(
            x => x.SynthesizeAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<IReadOnlyList<TechnologyLedgerEntry>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // RebuildArtifacts — both decision engine and artifact synthesis called
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ReplayAsync_RebuildArtifacts_CallsBothDecisionEngineAndArtifactSynthesis()
    {
        Guid runId = Guid.NewGuid();
        (AuthorityReplayService sut, _, Mock<IDecisionEngine> engine, Mock<IArtifactSynthesisService> artifactSvc, _, _)
            = Build(MakeFullDetailDto(runId));

        ReplayResult? result = await sut.ReplayAsync(
            new ReplayRequest { RunId = runId, Mode = ReplayMode.RebuildArtifacts },
            CancellationToken.None);

        result.Should().NotBeNull();
        result.RebuiltManifest.Should().NotBeNull();
        result.RebuiltArtifactBundle.Should().NotBeNull();
        engine.Verify(
            x => x.DecideAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<GraphSnapshot>(), It.IsAny<FindingsSnapshot>(), It.IsAny<CancellationToken>()),
            Times.Once);
        artifactSvc.Verify(
            x => x.SynthesizeAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<IReadOnlyList<TechnologyLedgerEntry>>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ReplayAsync_unknown_mode_throws_and_does_not_call_decision_engine()
    {
        Guid runId = Guid.NewGuid();
        (AuthorityReplayService sut, _, Mock<IDecisionEngine> engine, Mock<IArtifactSynthesisService> artifactSvc, _, _)
            = Build(MakeFullDetailDto(runId));

        Func<Task> act = () => sut.ReplayAsync(
            new ReplayRequest { RunId = runId, Mode = "DestroyEverything" },
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentOutOfRangeException>();
        engine.Verify(
            x => x.DecideAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<GraphSnapshot>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        artifactSvc.Verify(
            x => x.SynthesizeAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<IReadOnlyList<TechnologyLedgerEntry>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompareQuality_ReplayAsync_RebuildArtifacts_merges_technology_ledger_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string canonicalRunId = runGuid.ToString("N");
        string legacyUpper = canonicalRunId.ToUpperInvariant();

        RunDetailDto detail = MakeFullDetailDto(runGuid);

        TechnologyLedgerEntry legacyEntry = new()
        {
            EntryId = "ledger-replay-legacy",
            RunId = legacyUpper,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = "Amazon Web Services",
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
        };

        (AuthorityReplayService sut, _, _, Mock<IArtifactSynthesisService> artifactSvc, _, Mock<ITechnologyLedgerRepository> ledgerRepo)
            = Build(detail);

        ledgerRepo.Reset();
        ledgerRepo
            .Setup(repository => repository.GetByRunIdAsync(It.IsAny<ScopeContext>(), canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        ledgerRepo
            .Setup(repository => repository.GetByRunIdAsync(It.IsAny<ScopeContext>(), legacyUpper, It.IsAny<CancellationToken>()))
            .ReturnsAsync([legacyEntry]);
        ledgerRepo
            .Setup(repository => repository.GetByRunIdAsync(
                It.IsAny<ScopeContext>(),
                It.Is<string>(id => id != canonicalRunId && id != legacyUpper),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        IReadOnlyList<TechnologyLedgerEntry>? capturedLedger = null;
        artifactSvc
            .Setup(service => service.SynthesizeAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<IReadOnlyList<TechnologyLedgerEntry>>(),
                It.IsAny<CancellationToken>()))
            .Callback<ManifestDocument, IReadOnlyList<TechnologyLedgerEntry>, CancellationToken>(
                (_, ledger, _) => capturedLedger = ledger)
            .ReturnsAsync(new ArtifactBundle { BundleId = Guid.NewGuid() });

        ReplayResult? result = await sut.ReplayAsync(
            new ReplayRequest { RunId = runGuid, Mode = ReplayMode.RebuildArtifacts },
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.RebuiltArtifactBundle.Should().NotBeNull();
        capturedLedger.Should().NotBeNull();
        capturedLedger!.Should().ContainSingle(entry => entry.EntryId == "ledger-replay-legacy");
        ledgerRepo.Verify(
            repository => repository.GetByRunIdAsync(It.IsAny<ScopeContext>(), legacyUpper, It.IsAny<CancellationToken>()),
            Times.AtLeastOnce);
    }
}
