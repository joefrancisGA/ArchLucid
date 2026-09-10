using ArchLucid.Application.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class QuickScanSafetyOperationalStateProviderTests
{
    [Fact]
    public async Task GetSnapshotAsync_runtime_emergency_override_blocks_anonymous_execution()
    {
        InMemoryQuickScanSafetyOperationalStateStore store = new();
        await store.SetOverrideAsync(
            new QuickScanSafetyOperationalOverrideWriteRequest
            {
                Mode = QuickScanSafetyOperationalMode.EmergencyDisabled,
                PublicMessage = "Stopped.",
                Reason = "incident",
                ActorUserId = "ops",
                UpdatedUtc = DateTimeOffset.UtcNow,
            });

        QuickScanSafetyOperationalStateProvider sut = CreateProvider(store, new QuickScanSafetyOptions
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
        });

        QuickScanSafetyOperationalSnapshot snapshot = await sut.GetSnapshotAsync();

        snapshot.AnonymousExecutionAllowed.Should().BeFalse();
        snapshot.Mode.Should().Be(QuickScanSafetyOperationalMode.EmergencyDisabled);
        snapshot.PublicMessage.Should().Be("Stopped.");
    }

    [Fact]
    public async Task GetSnapshotAsync_store_failure_in_production_fails_closed()
    {
        Mock<IQuickScanSafetyOperationalStateStore> store = new();
        store
            .Setup(s => s.GetOverrideAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("db down"));

        QuickScanSafetyOperationalStateProvider sut = CreateProvider(
            store.Object,
            new QuickScanSafetyOptions { Enabled = true, AnonymousExecutionEnabled = true },
            isProduction: true);

        QuickScanSafetyOperationalSnapshot snapshot = await sut.GetSnapshotAsync();

        snapshot.AnonymousExecutionAllowed.Should().BeFalse();
        snapshot.StoreHealthy.Should().BeFalse();
    }

    [Fact]
    public async Task GetSnapshotAsync_store_failure_in_saas_environment_fails_closed()
    {
        Mock<IQuickScanSafetyOperationalStateStore> store = new();
        store
            .Setup(s => s.GetOverrideAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("db down"));

        QuickScanSafetyOperationalStateProvider sut = CreateProvider(
            store.Object,
            new QuickScanSafetyOptions { Enabled = true, AnonymousExecutionEnabled = true },
            environmentName: "SaaS");

        QuickScanSafetyOperationalSnapshot snapshot = await sut.GetSnapshotAsync();

        snapshot.AnonymousExecutionAllowed.Should().BeFalse();
        snapshot.StoreHealthy.Should().BeFalse();
    }

    [Fact]
    public async Task GetSnapshotAsync_store_failure_when_archlucid_environment_is_production_fails_closed()
    {
        Mock<IQuickScanSafetyOperationalStateStore> store = new();
        store
            .Setup(s => s.GetOverrideAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("db down"));

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ARCHLUCID_ENVIRONMENT"] = "Production" })
            .Build();

        QuickScanSafetyOperationalStateProvider sut = CreateProvider(
            store.Object,
            new QuickScanSafetyOptions { Enabled = true, AnonymousExecutionEnabled = true },
            environmentName: Environments.Development,
            configuration: configuration);

        QuickScanSafetyOperationalSnapshot snapshot = await sut.GetSnapshotAsync();

        snapshot.AnonymousExecutionAllowed.Should().BeFalse();
        snapshot.StoreHealthy.Should().BeFalse();
    }

    private static QuickScanSafetyOperationalStateProvider CreateProvider(
        IQuickScanSafetyOperationalStateStore store,
        QuickScanSafetyOptions options,
        bool isProduction = false,
        string? environmentName = null,
        IConfiguration? configuration = null)
    {
        Mock<IOptionsMonitor<QuickScanSafetyOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(options);

        Mock<IHostEnvironment> hostEnvironment = new();
        hostEnvironment.Setup(h => h.EnvironmentName).Returns(
            environmentName ?? (isProduction ? Environments.Production : Environments.Development));

        IConfiguration resolvedConfiguration = configuration ?? new ConfigurationBuilder().Build();

        return new QuickScanSafetyOperationalStateProvider(
            optionsMonitor.Object,
            store,
            new MemoryCache(new MemoryCacheOptions()),
            hostEnvironment.Object,
            resolvedConfiguration,
            NullLogger<QuickScanSafetyOperationalStateProvider>.Instance);
    }
}
