using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Category", "Unit")]
public sealed class TechnologyLedgerRequestSeederTests
{
    private static readonly DateTime FixedUtc = new(2026, 7, 7, 12, 0, 0, DateTimeKind.Utc);

    [Theory]
    [InlineData(CloudProvider.Azure, "Microsoft Azure")]
    [InlineData(CloudProvider.Aws, "Amazon Web Services")]
    [InlineData(CloudProvider.Gcp, "Google Cloud Platform")]
    [InlineData(CloudProvider.None, "Cloud-neutral (no specific provider)")]
    public void BuildCloudPlatformEntry_MapsProviderFamily_ToTechnologyName(
        CloudProvider provider,
        string expectedTechnologyName)
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-1",
            Description = new string('x', 12),
            SystemName = "Sys",
            Environment = "prod",
            CloudProvider = provider,
        };

        TechnologyLedgerEntry entry = TechnologyLedgerRequestSeeder.BuildCloudPlatformEntry(
            "run123",
            request,
            FixedUtc);

        entry.RunId.Should().Be("run123");
        entry.Role.Should().Be(TechnologyLedgerRole.CloudPlatform);
        entry.TechnologyName.Should().Be(expectedTechnologyName);
        entry.ProviderFamily.Should().Be(provider);
        entry.Status.Should().Be(TechnologyLedgerStatus.Chosen);
        entry.Source.Should().Be(TechnologyLedgerSource.User);
        entry.IsLocked.Should().BeFalse();
        entry.CreatedUtc.Should().Be(FixedUtc);
        entry.UpdatedUtc.Should().Be(FixedUtc);
    }

    [Fact]
    public void BuildCloudPlatformEntry_UsesDraftIntakeRationale_WhenRequestSourceIsDraftIntake()
    {
        ArchitectureRequest request = CreateRequest();
        request.RequestSource = "draft-intake";

        TechnologyLedgerEntry entry = TechnologyLedgerRequestSeeder.BuildCloudPlatformEntry(
            "run123",
            request,
            FixedUtc);

        entry.Rationale.Should().Be("Explicit answer to the required target-cloud intake question.");
    }

    [Fact]
    public void BuildCloudPlatformEntry_UsesDirectRequestRationale_WhenRequestSourceIsNotDraftIntake()
    {
        ArchitectureRequest request = CreateRequest();
        request.RequestSource = "cli";

        TechnologyLedgerEntry entry = TechnologyLedgerRequestSeeder.BuildCloudPlatformEntry(
            "run123",
            request,
            FixedUtc);

        entry.Rationale.Should()
            .Be("Directly specified on ArchitectureRequest.CloudProvider by the request source.");
    }

    [Fact]
    public async Task SeedAsync_PersistsEntryThroughRepository()
    {
        InMemoryTechnologyLedgerRepository repository = new();
        FakeTimeProvider timeProvider = new(FixedUtc);
        TechnologyLedgerRequestSeeder seeder = new(repository, timeProvider);
        ArchitectureRequest request = CreateRequest();
        request.CloudProvider = CloudProvider.Azure;

        await seeder.SeedAsync("run123", request, CancellationToken.None);

        IReadOnlyList<TechnologyLedgerEntry> entries = await repository.GetByRunIdAsync(
            new Core.Scoping.ScopeContext(),
            "run123",
            CancellationToken.None);

        entries.Should().ContainSingle();
        entries[0].ProviderFamily.Should().Be(CloudProvider.Azure);
    }

    private static ArchitectureRequest CreateRequest() => new()
    {
        RequestId = "req-1",
        Description = new string('x', 12),
        SystemName = "Sys",
        Environment = "prod",
        CloudProvider = CloudProvider.None,
    };

    private sealed class FakeTimeProvider(DateTime utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(utcNow, TimeSpan.Zero);
    }
}
