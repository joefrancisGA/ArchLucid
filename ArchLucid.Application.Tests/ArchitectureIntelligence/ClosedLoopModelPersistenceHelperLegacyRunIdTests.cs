using ArchLucid.Application.Analysis;
using ArchLucid.Application.ArchitectureIntelligence.Stages;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopModelPersistenceHelperLegacyRunIdTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task CompareQuality_TryLoadLedgerEntriesAsync_merges_technology_ledger_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();

        TechnologyLedgerEntry legacyLedgerRow = new()
        {
            EntryId = "ledger-closed-loop-1",
            RunId = legacyUpper,
            Role = TechnologyLedgerRole.PrimaryDatastore,
            TechnologyName = "PostgreSQL",
            ProviderFamily = CloudProvider.None,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        Mock<ITechnologyLedgerRepository> ledgerRepository = new();
        ledgerRepository
            .Setup(repository => repository.GetByRunIdAsync(TestScope, canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([legacyLedgerRow]);

        ClosedLoopModelPersistenceHelper sut = new(technologyLedgerRepository: ledgerRepository.Object, scopeContextProvider: scopeProvider.Object);

        IReadOnlyList<TechnologyLedgerEntry>? loaded = await sut.TryLoadLedgerEntriesAsync(runGuid.ToString(), CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.Should().ContainSingle(entry => entry.EntryId == "ledger-closed-loop-1");
    }
}
