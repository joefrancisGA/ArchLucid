using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Category", "Unit")]
public sealed class TechnologyLedgerEvidenceMergePolicyTests
{
    private static readonly DateTime FixedUtc = new(2026, 7, 7, 14, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Resolve_returns_candidate_when_role_slot_empty()
    {
        TechnologyLedgerEntry candidate = BuildCandidate(CloudProvider.Aws);

        TechnologyLedgerEntry? resolved = TechnologyLedgerEvidenceMergePolicy.Resolve(candidate, []);

        resolved.Should().BeSameAs(candidate);
    }

    [Fact]
    public void Resolve_skips_when_chosen_provider_matches()
    {
        TechnologyLedgerEntry candidate = BuildCandidate(CloudProvider.Azure);
        TechnologyLedgerEntry existing = BuildChosen(CloudProvider.Azure);

        TechnologyLedgerEntry? resolved = TechnologyLedgerEvidenceMergePolicy.Resolve(candidate, [existing]);

        resolved.Should().BeNull();
    }

    [Fact]
    public void Resolve_returns_alternative_when_chosen_provider_differs()
    {
        TechnologyLedgerEntry candidate = BuildCandidate(CloudProvider.Aws);
        TechnologyLedgerEntry existing = BuildChosen(CloudProvider.Azure);

        TechnologyLedgerEntry? resolved = TechnologyLedgerEvidenceMergePolicy.Resolve(candidate, [existing]);

        resolved.Should().NotBeNull();
        resolved!.Status.Should().Be(TechnologyLedgerStatus.Alternative);
        resolved.Source.Should().Be(TechnologyLedgerSource.Evidence);
        resolved.Rationale.Should().Contain("Aws").And.Contain("Azure");
    }

    private static TechnologyLedgerEntry BuildCandidate(CloudProvider provider) => new()
    {
        RunId = "run123",
        Role = TechnologyLedgerRole.CloudPlatform,
        TechnologyName = "candidate",
        ProviderFamily = provider,
        Status = TechnologyLedgerStatus.Chosen,
        Source = TechnologyLedgerSource.Evidence,
        EvidenceRef = "azureExtractorPackage:abc",
        CreatedUtc = FixedUtc,
        UpdatedUtc = FixedUtc,
    };

    private static TechnologyLedgerEntry BuildChosen(CloudProvider provider) => new()
    {
        RunId = "run123",
        Role = TechnologyLedgerRole.CloudPlatform,
        TechnologyName = "chosen",
        ProviderFamily = provider,
        Status = TechnologyLedgerStatus.Chosen,
        Source = TechnologyLedgerSource.User,
        CreatedUtc = FixedUtc,
        UpdatedUtc = FixedUtc,
    };
}
