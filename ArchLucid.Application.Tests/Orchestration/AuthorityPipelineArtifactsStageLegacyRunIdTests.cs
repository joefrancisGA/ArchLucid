using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Manifest;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Category", "Unit")]
public sealed class AuthorityPipelineArtifactsStageLegacyRunIdTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task CompareQuality_ExecuteAsync_merges_technology_ledger_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();
        Guid manifestId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid traceId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        TechnologyLedgerEntry legacyEntry = new()
        {
            EntryId = "ledger-artifacts-legacy",
            RunId = legacyUpper,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = "Amazon Web Services",
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
        };

        Mock<ITechnologyLedgerRepository> ledgerRepository = new();
        ledgerRepository
            .Setup(repository => repository.GetByRunIdAsync(TestScope, canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([legacyEntry]);

        IReadOnlyList<TechnologyLedgerEntry>? capturedLedger = null;
        Mock<IArtifactSynthesisService> synthesis = new();
        synthesis
            .Setup(service => service.SynthesizeAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<IReadOnlyList<TechnologyLedgerEntry>>(),
                It.IsAny<CancellationToken>()))
            .Callback<ManifestDocument, IReadOnlyList<TechnologyLedgerEntry>, CancellationToken>(
                (_, ledger, _) => capturedLedger = ledger)
            .ReturnsAsync(new ArtifactBundle
            {
                BundleId = Guid.NewGuid(),
                RunId = runGuid,
                ManifestId = manifestId,
                CreatedUtc = DateTime.UtcNow,
                Artifacts = [],
                Trace = new SynthesisTrace { TraceId = Guid.NewGuid() },
            });

        Mock<IAuthorityPipelineStagePersistence> persistence = new();
        persistence
            .Setup(p => p.SaveArtifactBundleAsync(It.IsAny<ArtifactBundle>(), It.IsAny<IArchLucidUnitOfWork>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        persistence
            .Setup(p => p.UpdateRunAsync(It.IsAny<RunRecord>(), It.IsAny<IArchLucidUnitOfWork>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<IArchLucidUnitOfWork>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        await using IArchLucidUnitOfWork uow = await ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory().CreateAsync(CancellationToken.None);

        AuthorityPipelineContext context = new()
        {
            Run = new RunRecord { RunId = runGuid },
            Scope = TestScope,
            UnitOfWork = uow,
            Request = new ContextIngestionRequest(),
            Manifest = new ManifestDocument
            {
                ManifestId = manifestId,
                RunId = runGuid,
                CreatedUtc = DateTime.UtcNow,
                ManifestHash = "hash",
                RuleSetId = "rules",
                RuleSetVersion = "1",
                RuleSetHash = "rule-hash",
            },
            Trace = RuleAuditTraceDto.From(new RuleAuditTracePayload
            {
                DecisionTraceId = traceId,
                RunId = runGuid,
                CreatedUtc = DateTime.UtcNow,
            }),
        };

        AuthorityPipelineArtifactsStage sut = new(
            ledgerRepository.Object,
            synthesis.Object,
            persistence.Object,
            audit.Object,
            NullLogger<AuthorityPipelineArtifactsStage>.Instance);

        await sut.ExecuteAsync(context, CancellationToken.None);

        capturedLedger.Should().NotBeNull();
        capturedLedger!.Should().ContainSingle(entry => entry.EntryId == "ledger-artifacts-legacy");
        ledgerRepository.Verify(
            repository => repository.GetByRunIdAsync(TestScope, canonicalRunId, It.IsAny<CancellationToken>()),
            Times.AtLeastOnce);
    }
}
