using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class TenantBrandingCacheSingleFlightTests
{
    [Fact]
    public async Task Concurrent_misses_same_tenant_load_once()
    {
        using MemoryCache memory = new(new MemoryCacheOptions());
        TenantBrandingResolvedProfileCache cache = new(memory);
        Guid tenant = Guid.NewGuid();
        int calls = 0;
        TaskCompletionSource<bool> release = new(TaskCreationOptions.RunContinuationsAsynchronously);

        async Task<ResolvedTenantBrandingProfile> Load(CancellationToken ct)
        {
            Interlocked.Increment(ref calls);
            await release.Task.WaitAsync(ct);
            return new ResolvedTenantBrandingProfile
            {
                TenantId = tenant,
                IsProductBrand = true,
                CompanyDisplayName = "Example",
            };
        }

        Task<ResolvedTenantBrandingProfile>[] readers = Enumerable.Range(0, 20)
            .Select(_ => cache.GetOrLoadAsync(tenant, Load))
            .ToArray();
        release.SetResult(true);
        ResolvedTenantBrandingProfile[] results = await Task.WhenAll(readers);

        calls.Should().Be(1);
        results.Should().OnlyContain(r => r.TenantId == tenant);
    }

    [Fact]
    public async Task Invalidation_forces_next_miss_to_reload()
    {
        using MemoryCache memory = new(new MemoryCacheOptions());
        TenantBrandingResolvedProfileCache cache = new(memory);
        Guid tenant = Guid.NewGuid();
        int calls = 0;
        Task<ResolvedTenantBrandingProfile> Load(CancellationToken _) =>
            Task.FromResult(new ResolvedTenantBrandingProfile
            {
                TenantId = tenant,
                IsProductBrand = true,
                CompanyDisplayName = (++calls).ToString(),
            });

        (await cache.GetOrLoadAsync(tenant, Load)).CompanyDisplayName.Should().Be("1");
        (await cache.GetOrLoadAsync(tenant, Load)).CompanyDisplayName.Should().Be("1");
        cache.InvalidateTenantCache(tenant);
        (await cache.GetOrLoadAsync(tenant, Load)).CompanyDisplayName.Should().Be("2");
    }

    [Fact]
    public async Task Invalidation_during_inflight_load_prevents_stale_recache()
    {
        using MemoryCache memory = new(new MemoryCacheOptions());
        TenantBrandingResolvedProfileCache cache = new(memory);
        Guid tenant = Guid.NewGuid();
        TaskCompletionSource<bool> release = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource<bool> started = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Task<ResolvedTenantBrandingProfile> old = cache.GetOrLoadAsync(tenant, async ct =>
        {
            started.SetResult(true);
            await release.Task.WaitAsync(ct);
            return new ResolvedTenantBrandingProfile
            {
                TenantId = tenant, IsProductBrand = true, CompanyDisplayName = "Stale"
            };
        });
        await started.Task;
        cache.InvalidateTenantCache(tenant);
        release.SetResult(true);
        (await old).CompanyDisplayName.Should().Be("Stale");
        cache.TryGet(tenant, out _).Should().BeFalse();
        (await cache.GetOrLoadAsync(tenant, _ =>
            Task.FromResult(new ResolvedTenantBrandingProfile
            {
                TenantId = tenant, IsProductBrand = true, CompanyDisplayName = "Fresh"
            }))).CompanyDisplayName.Should().Be("Fresh");
        cache.TryGet(tenant, out ResolvedTenantBrandingProfile? cached).Should().BeTrue();
        cached!.CompanyDisplayName.Should().Be("Fresh");
    }

    [Fact]
    public async Task Cancelled_waiter_does_not_cancel_existing_loader()
    {
        using MemoryCache memory = new(new MemoryCacheOptions());
        TenantBrandingResolvedProfileCache cache = new(memory);
        Guid tenant = Guid.NewGuid();
        TaskCompletionSource<bool> release = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Task<ResolvedTenantBrandingProfile> first = cache.GetOrLoadAsync(
            tenant, async ct =>
            {
                await release.Task.WaitAsync(ct);
                return new ResolvedTenantBrandingProfile { TenantId = tenant, IsProductBrand = true, CompanyDisplayName = "Good" };
            });

        using CancellationTokenSource cts = new();
        cts.Cancel();
        Func<Task> cancelled = async () => await cache.GetOrLoadAsync(
            tenant, _ => throw new InvalidOperationException("should not load"), cts.Token);
        await cancelled.Should().ThrowAsync<OperationCanceledException>();
        release.SetResult(true);
        (await first).CompanyDisplayName.Should().Be("Good");
    }
}
