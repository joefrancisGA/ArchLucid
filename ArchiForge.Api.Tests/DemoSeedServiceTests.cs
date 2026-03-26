using ArchiForge.Application;
using ArchiForge.Application.Bootstrap;
using ArchiForge.Application.Governance.Preview;
using ArchiForge.Contracts.Architecture;
using ArchiForge.Contracts.Governance.Preview;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

namespace ArchiForge.Api.Tests;

/// <summary>Validates 50R Contoso demo seed against the shared SQLite test database.</summary>
[Trait("Category", "Integration")]
public sealed class DemoSeedServiceTests
{
    [Fact]
    public async Task SeedAsync_twice_does_not_throw_and_remains_idempotent()
    {
        await using ArchiForgeApiFactory factory = new();
        using IServiceScope scope = factory.Services.CreateScope();
        IDemoSeedService seed = scope.ServiceProvider.GetRequiredService<IDemoSeedService>();
        await seed.SeedAsync();
        Func<Task> second = async () => await seed.SeedAsync();
        await second.Should().NotThrowAsync();
    }

    [Fact]
    public async Task SeedAsync_creates_baseline_and_hardened_runs_with_manifests()
    {
        await using ArchiForgeApiFactory factory = new();
        using IServiceScope scope = factory.Services.CreateScope();
        IDemoSeedService seed = scope.ServiceProvider.GetRequiredService<IDemoSeedService>();
        await seed.SeedAsync();

        IRunDetailQueryService detail = scope.ServiceProvider.GetRequiredService<IRunDetailQueryService>();

        ArchitectureRunDetail? baseline = await detail.GetRunDetailAsync(ContosoRetailDemoIdentifiers.RunBaseline);
        baseline.Should().NotBeNull();
        baseline.Manifest.Should().NotBeNull();
        baseline.Run.CurrentManifestVersion.Should().Be(ContosoRetailDemoIdentifiers.ManifestBaseline);
        baseline.Results.Should().NotBeEmpty();

        ArchitectureRunDetail? hardened = await detail.GetRunDetailAsync(ContosoRetailDemoIdentifiers.RunHardened);
        hardened.Should().NotBeNull();
        hardened.Manifest.Should().NotBeNull();
        hardened.Run.CurrentManifestVersion.Should().Be(ContosoRetailDemoIdentifiers.ManifestHardened);
    }

    [Fact]
    public async Task SeedAsync_governance_activations_allow_environment_compare_preview()
    {
        await using ArchiForgeApiFactory factory = new();
        using IServiceScope scope = factory.Services.CreateScope();
        IDemoSeedService seed = scope.ServiceProvider.GetRequiredService<IDemoSeedService>();
        await seed.SeedAsync();

        IGovernancePreviewService preview = scope.ServiceProvider.GetRequiredService<IGovernancePreviewService>();
        GovernanceEnvironmentComparisonResult result = await preview.CompareEnvironmentsAsync(
            new GovernanceEnvironmentComparisonRequest
            {
                SourceEnvironment = "dev",
                TargetEnvironment = "test"
            });

        result.Differences.Should().NotBeEmpty("baseline vs hardened governance should differ");
    }
}
