using ArchLucid.AgentRuntime;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.AgentRuntime;

[Trait("Category", "Unit")]
public sealed class TechnologyLedgerUserPromptInjectionLegacyRunIdTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
    };

    [Fact]
    public async Task CompareQuality_LoadAsync_merges_rows_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string runId = runGuid.ToString("N");
        string legacyUpper = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId).ToUpperInvariant();

        InMemoryTechnologyLedgerRepository ledgerRepository = new();
        await ledgerRepository.AddAsync(
            new TechnologyLedgerEntry
            {
                EntryId = "legacy-prompt-entry",
                RunId = legacyUpper,
                Role = TechnologyLedgerRole.CloudPlatform,
                TechnologyName = "Microsoft Azure",
                ProviderFamily = CloudProvider.Azure,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        ArchitectureRequest request = new()
        {
            CloudProvider = CloudProvider.Azure,
        };

        (_, IReadOnlyList<TechnologyLedgerEntry> entries) = await TechnologyLedgerUserPromptInjection.LoadAsync(
            ledgerRepository,
            scopeProvider.Object,
            runId,
            request,
            CancellationToken.None);

        entries.Should().ContainSingle(entry => entry.EntryId == "legacy-prompt-entry");
    }
}
