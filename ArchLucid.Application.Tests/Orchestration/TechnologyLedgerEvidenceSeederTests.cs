using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Category", "Unit")]
public sealed class TechnologyLedgerEvidenceSeederTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    private static readonly DateTime FixedUtc = new(2026, 7, 7, 14, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task SeedAsync_persists_iac_and_iac_target_rows()
    {
        InMemoryTechnologyLedgerRepository repository = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        JsonInfrastructureDeclarationParser parser = new(NullLogger<JsonInfrastructureDeclarationParser>.Instance);
        InfrastructureDeclarationsPayloadNormalizer normalizer = new([parser]);

        TechnologyLedgerEvidenceSeeder seeder = new(
            repository,
            scopeProvider.Object,
            Mock.Of<IAzureExtractorPackageRepository>(),
            Mock.Of<ICloudInventoryExtractorPackageRepository>(),
            normalizer,
            new FakeTimeProvider(FixedUtc));

        ArchitectureRequest request = new()
        {
            RequestId = "req-iac",
            Description = new string('d', 12),
            SystemName = "Sys",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationRequest
                {
                    Name = "core.json",
                    Format = "json",
                    Content = """
                              {
                                "resources": [
                                  { "type": "database", "name": "orders-db", "region": "eastus", "properties": {} }
                                ]
                              }
                              """,
                },
            ],
        };

        await seeder.SeedAsync("run123", request, CancellationToken.None);

        IReadOnlyList<TechnologyLedgerEntry> entries = await repository.GetByRunIdAsync(TestScope, "run123", CancellationToken.None);

        entries.Should().Contain(entry => entry.Role == TechnologyLedgerRole.IacTarget && entry.Source == TechnologyLedgerSource.Evidence);
        entries.Should().Contain(entry =>
            entry.Role == TechnologyLedgerRole.PrimaryDatastore
            && entry.Source == TechnologyLedgerSource.Evidence
            && entry.Status == TechnologyLedgerStatus.Chosen);
        entries.Should().Contain(entry => entry.Role == TechnologyLedgerRole.Region && entry.TechnologyName == "eastus");
    }

    [Fact]
    public async Task SeedAsync_persists_azure_inventory_cloud_platform_row()
    {
        InMemoryTechnologyLedgerRepository repository = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Guid runGuid = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        Guid packageId = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");

        Mock<IAzureExtractorPackageRepository> azureRepository = new();
        azureRepository
            .Setup(r => r.TryGetLatestProvenanceByRunIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureExtractorPackageProvenance
            {
                PackageId = packageId,
                SchemaVersion = 1,
                OriginalFileName = "azure-inventory.zip",
                CreatedUtc = FixedUtc,
            });

        TechnologyLedgerEvidenceSeeder seeder = new(
            repository,
            scopeProvider.Object,
            azureRepository.Object,
            Mock.Of<ICloudInventoryExtractorPackageRepository>(),
            new InfrastructureDeclarationsPayloadNormalizer([]),
            new FakeTimeProvider(FixedUtc));

        ArchitectureRequest request = CreateBareRequest();

        await seeder.SeedAsync(runGuid.ToString("N"), request, CancellationToken.None);

        IReadOnlyList<TechnologyLedgerEntry> entries = await repository.GetByRunIdAsync(TestScope, runGuid.ToString("N"), CancellationToken.None);

        entries.Should().ContainSingle();
        entries[0].Role.Should().Be(TechnologyLedgerRole.CloudPlatform);
        entries[0].ProviderFamily.Should().Be(CloudProvider.Azure);
        entries[0].EvidenceRef.Should().Be($"azureExtractorPackage:{packageId:N}");
    }

    [Fact]
    public async Task SeedAsync_marks_conflicting_cloud_platform_as_alternative_when_user_chosen_exists()
    {
        InMemoryTechnologyLedgerRepository repository = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Guid runGuid = Guid.Parse("cccccccccccccccccccccccccccccccc");

        await repository.AddAsync(
            new TechnologyLedgerEntry
            {
                RunId = runGuid.ToString("N"),
                Role = TechnologyLedgerRole.CloudPlatform,
                TechnologyName = "Microsoft Azure",
                ProviderFamily = CloudProvider.Azure,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = FixedUtc,
                UpdatedUtc = FixedUtc,
            },
            CancellationToken.None);

        Mock<ICloudInventoryExtractorPackageRepository> cloudRepository = new();
        cloudRepository
            .Setup(r => r.TryGetLatestProvenanceByRunIdAsync(
                TestScope,
                runGuid,
                CloudProvider.Aws,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CloudInventoryExtractorPackageProvenance
            {
                PackageId = Guid.Parse("dddddddddddddddddddddddddddddddd"),
                CloudProvider = CloudProvider.Aws,
                SchemaVersion = 1,
                ScopeId = "123456789012",
                OriginalFileName = "aws.zip",
                CreatedUtc = FixedUtc,
            });

        TechnologyLedgerEvidenceSeeder seeder = new(
            repository,
            scopeProvider.Object,
            Mock.Of<IAzureExtractorPackageRepository>(),
            cloudRepository.Object,
            new InfrastructureDeclarationsPayloadNormalizer([]),
            new FakeTimeProvider(FixedUtc));

        await seeder.SeedAsync(runGuid.ToString("N"), CreateBareRequest(), CancellationToken.None);

        IReadOnlyList<TechnologyLedgerEntry> entries = await repository.GetByRunIdAsync(
            TestScope,
            runGuid.ToString("N"),
            CancellationToken.None);

        entries.Should().HaveCount(2);
        entries.Should().Contain(entry =>
            entry.Role == TechnologyLedgerRole.CloudPlatform
            && entry.Status == TechnologyLedgerStatus.Chosen
            && entry.Source == TechnologyLedgerSource.User);
        entries.Should().Contain(entry =>
            entry.Role == TechnologyLedgerRole.CloudPlatform
            && entry.Status == TechnologyLedgerStatus.Alternative
            && entry.ProviderFamily == CloudProvider.Aws);
    }

    private static ArchitectureRequest CreateBareRequest() => new()
    {
        RequestId = "req-evidence",
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
