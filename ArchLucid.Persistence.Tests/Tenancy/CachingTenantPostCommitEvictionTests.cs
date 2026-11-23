using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Tenancy;

using Moq;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CachingTenantPostCommitEvictionTests
{
    [Theory]
    [InlineData("enterprise-increment")]
    [InlineData("enterprise-decrement")]
    [InlineData("erasure-approve")]
    [InlineData("erasure-revert")]
    [InlineData("erasure-offboard")]
    [InlineData("erasure-restore")]
    public async Task Completed_mutation_evicts_even_if_request_is_cancelled_after_write(string operation)
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 11, 22, 15, 0, 0, TimeSpan.Zero);
        using CancellationTokenSource request = new();

        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        Mock<IHotPathReadCache> cache = new(MockBehavior.Strict);
        string key = HotPathCacheKeys.TenantById(tenantId);
        cache.Setup(store => store.RemoveAsync(key, It.IsAny<CancellationToken>()))
            .Callback<string, CancellationToken>((_, token) => token.ThrowIfCancellationRequested())
            .Returns(Task.CompletedTask);
        CachingTenantRepository repository = new(inner.Object, cache.Object);

        Func<Task> call;
        switch (operation)
        {
            case "enterprise-increment":
                inner.Setup(x => x.TryIncrementEnterpriseScimSeatAsync(tenantId, request.Token))
                    .Callback(request.Cancel).ReturnsAsync(true);
                call = async () => (await repository.TryIncrementEnterpriseScimSeatAsync(
                    tenantId, request.Token)).Should().BeTrue();
                break;
            case "enterprise-decrement":
                inner.Setup(x => x.DecrementEnterpriseScimSeatAsync(tenantId, request.Token))
                    .Callback(request.Cancel).Returns(Task.CompletedTask);
                call = () => repository.DecrementEnterpriseScimSeatAsync(tenantId, request.Token);
                break;
            case "erasure-approve":
                inner.Setup(x => x.TryApproveTenantErasureAsync(
                        tenantId, now, "approver", request.Token))
                    .Callback(request.Cancel).ReturnsAsync(true);
                call = async () => (await repository.TryApproveTenantErasureAsync(
                    tenantId, now, "approver", request.Token)).Should().BeTrue();
                break;
            case "erasure-revert":
                inner.Setup(x => x.TryRevertTenantErasureApprovalAsync(tenantId, request.Token))
                    .Callback(request.Cancel).ReturnsAsync(true);
                call = async () => (await repository.TryRevertTenantErasureApprovalAsync(
                    tenantId, request.Token)).Should().BeTrue();
                break;
            case "erasure-offboard":
                inner.Setup(x => x.TryStartTenantErasureOffboardAsync(
                        tenantId, now, now.AddDays(30), request.Token))
                    .Callback(request.Cancel).ReturnsAsync(true);
                call = async () => (await repository.TryStartTenantErasureOffboardAsync(
                    tenantId, now, now.AddDays(30), request.Token)).Should().BeTrue();
                break;
            case "erasure-restore":
                inner.Setup(x => x.TryRestoreTenantErasureQuarantineAsync(tenantId, request.Token))
                    .Callback(request.Cancel).ReturnsAsync(true);
                call = async () => (await repository.TryRestoreTenantErasureQuarantineAsync(
                    tenantId, request.Token)).Should().BeTrue();
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(operation));
        }

        await call();

        request.IsCancellationRequested.Should().BeTrue();
        inner.VerifyAll();
        cache.Verify(store => store.RemoveAsync(key, CancellationToken.None), Times.Once);
    }

    [Theory]
    [InlineData("erasure-approve")]
    [InlineData("erasure-revert")]
    [InlineData("erasure-offboard")]
    [InlineData("erasure-restore")]
    [InlineData("enterprise-increment")]
    public async Task No_op_or_rejected_mutation_does_not_evict(string operation)
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 11, 22, 15, 0, 0, TimeSpan.Zero);
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        Mock<IHotPathReadCache> cache = new(MockBehavior.Strict);
        CachingTenantRepository repository = new(inner.Object, cache.Object);

        switch (operation)
        {
            case "erasure-approve":
                inner.Setup(x => x.TryApproveTenantErasureAsync(tenantId, now, "admin", CancellationToken.None))
                    .ReturnsAsync(false);
                (await repository.TryApproveTenantErasureAsync(
                    tenantId, now, "admin", CancellationToken.None)).Should().BeFalse();
                break;
            case "erasure-revert":
                inner.Setup(x => x.TryRevertTenantErasureApprovalAsync(tenantId, CancellationToken.None))
                    .ReturnsAsync(false);
                (await repository.TryRevertTenantErasureApprovalAsync(
                    tenantId, CancellationToken.None)).Should().BeFalse();
                break;
            case "erasure-offboard":
                inner.Setup(x => x.TryStartTenantErasureOffboardAsync(
                    tenantId, now, now.AddDays(30), CancellationToken.None)).ReturnsAsync(false);
                (await repository.TryStartTenantErasureOffboardAsync(
                    tenantId, now, now.AddDays(30), CancellationToken.None)).Should().BeFalse();
                break;
            case "erasure-restore":
                inner.Setup(x => x.TryRestoreTenantErasureQuarantineAsync(
                    tenantId, CancellationToken.None)).ReturnsAsync(false);
                (await repository.TryRestoreTenantErasureQuarantineAsync(
                    tenantId, CancellationToken.None)).Should().BeFalse();
                break;
            case "enterprise-increment":
                inner.Setup(x => x.TryIncrementEnterpriseScimSeatAsync(
                    tenantId, CancellationToken.None)).ReturnsAsync(false);
                (await repository.TryIncrementEnterpriseScimSeatAsync(
                    tenantId, CancellationToken.None)).Should().BeFalse();
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(operation));
        }

        inner.VerifyAll();
        cache.Verify(x => x.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Failed_approval_preserves_original_error_without_eviction()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 11, 22, 15, 0, 0, TimeSpan.Zero);
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        inner.Setup(x => x.TryApproveTenantErasureAsync(tenantId, now, "admin", CancellationToken.None))
            .ThrowsAsync(new InvalidOperationException("approval failed"));
        Mock<IHotPathReadCache> cache = new(MockBehavior.Strict);
        CachingTenantRepository repository = new(inner.Object, cache.Object);

        Func<Task> act = () => repository.TryApproveTenantErasureAsync(
            tenantId, now, "admin", CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("approval failed");
        cache.Verify(x => x.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
