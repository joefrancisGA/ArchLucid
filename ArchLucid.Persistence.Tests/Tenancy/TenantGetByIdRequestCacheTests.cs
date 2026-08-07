using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class TenantGetByIdRequestCacheTests
{
    [Fact]
    public async Task GetByIdAsync_second_call_same_request_does_not_invoke_inner_twice()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        TenantRecord tenant = new() { Id = tenantId, Name = "Acme", Slug = "acme" };
        Mock<ITenantRepository> inner = new();
        inner.Setup(repository => repository.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);

        TenantGetByIdRequestCache cache = new(inner.Object);

        TenantRecord? first = await cache.GetByIdAsync(tenantId, CancellationToken.None);
        TenantRecord? second = await cache.GetByIdAsync(tenantId, CancellationToken.None);

        first.Should().BeSameAs(tenant);
        second.Should().BeSameAs(tenant);
        inner.Verify(repository => repository.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_caches_null_result()
    {
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Mock<ITenantRepository> inner = new();
        inner.Setup(repository => repository.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        TenantGetByIdRequestCache cache = new(inner.Object);

        (await cache.GetByIdAsync(tenantId, CancellationToken.None)).Should().BeNull();
        (await cache.GetByIdAsync(tenantId, CancellationToken.None)).Should().BeNull();
        inner.Verify(repository => repository.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
