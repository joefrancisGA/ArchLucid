using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class SqlFirstSessionLifecycleHookTests
{
    [Fact]
    public async Task OnSuccessfulManifestCommitAsync_noops_for_empty_tenant()
    {
        Mock<ITenantOnboardingStateRepository> repository = new(MockBehavior.Strict);

        SqlFirstSessionLifecycleHook sut = new(repository.Object);

        await sut.OnSuccessfulManifestCommitAsync(Guid.Empty, CancellationToken.None);

        repository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task OnSuccessfulManifestCommitAsync_records_metrics_only_on_first_session()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<ITenantOnboardingStateRepository> repository = new();
        repository
            .Setup(r => r.TryMarkFirstSessionCompletedAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        SqlFirstSessionLifecycleHook sut = new(repository.Object);

        await sut.OnSuccessfulManifestCommitAsync(tenantId, CancellationToken.None);

        repository.Verify(
            r => r.TryMarkFirstSessionCompletedAsync(tenantId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task OnSuccessfulManifestCommitAsync_records_metrics_when_first_session()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<ITenantOnboardingStateRepository> repository = new();
        repository
            .Setup(r => r.TryMarkFirstSessionCompletedAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        SqlFirstSessionLifecycleHook sut = new(repository.Object);

        await sut.OnSuccessfulManifestCommitAsync(tenantId, CancellationToken.None);

        repository.Verify(
            r => r.TryMarkFirstSessionCompletedAsync(tenantId, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
