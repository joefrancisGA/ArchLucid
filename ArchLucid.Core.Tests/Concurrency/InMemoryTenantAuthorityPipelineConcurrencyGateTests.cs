using ArchLucid.Core.Authority;
using ArchLucid.Core.Concurrency;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Core.Tests.Concurrency;

[Trait("Category", "Unit")]
public sealed class InMemoryTenantAuthorityPipelineConcurrencyGateTests
{
    [Fact]
    public async Task AcquireExecutionSlotAsync_bypass_when_max_disabled()
    {
        InMemoryTenantAuthorityPipelineConcurrencyGate sut = new(CreateMonitor(maxConcurrent: 0).Object);

        IAsyncDisposable lease =
            await sut.AcquireExecutionSlotAsync(Guid.NewGuid(), Guid.NewGuid(), failFastWhenUnavailable: true,
                CancellationToken.None);

        await lease.DisposeAsync();
    }

    [Fact]
    public async Task AcquireExecutionSlotAsync_second_acquire_throws_when_fail_fast_and_capacity_one()
    {
        Guid tenant = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        InMemoryTenantAuthorityPipelineConcurrencyGate sut = new(CreateMonitor(maxConcurrent: 1).Object);

        await using (await sut.AcquireExecutionSlotAsync(tenant, Guid.NewGuid(), failFastWhenUnavailable: true,

                   CancellationToken.None))
        {


            Func<Task> act =
                () => sut.AcquireExecutionSlotAsync(tenant, Guid.NewGuid(), failFastWhenUnavailable: true,

                    CancellationToken.None);


            await act.Should().ThrowAsync<AuthorityTenantConcurrencyLimitExceededException>();
        }
    }

    private static Mock<IOptionsMonitor<AuthorityPipelineOptions>> CreateMonitor(int maxConcurrent)
    {
        Mock<IOptionsMonitor<AuthorityPipelineOptions>> mock = new();

        mock.Setup(m => m.CurrentValue)
            .Returns(
                new AuthorityPipelineOptions { Concurrency = new AuthorityPipelineConcurrencyOptions { MaxConcurrentExecutionsPerTenant = maxConcurrent } });


        return mock;
    }


}
