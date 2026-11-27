using ArchLucid.Core.Integration;

namespace ArchLucid.Persistence.Tests.IntegrationOutbox;

internal static class AzureDevOpsThreadClaimStoreContract
{
    internal static async Task VerifyAsync(
        IAzureDevOpsThreadCreateClaimStore first,
        IAzureDevOpsThreadCreateClaimStore second)
    {
        AzureDevOpsThreadCreateClaim key = new(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), 42);
        TaskCompletionSource release = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Task<bool>[] attempts = Enumerable.Range(0, 16)
            .Select(index => ClaimAsync(index % 2 == 0 ? first : second))
            .ToArray();

        release.SetResult();
        bool[] results = await Task.WhenAll(attempts);
        Assert.Single(results, granted => granted);
        Assert.False(await second.TryClaimAsync(key, CancellationToken.None));

        Assert.True(await second.TryClaimAsync(key with { TenantId = Guid.NewGuid() }, CancellationToken.None));
        Assert.True(await second.TryClaimAsync(key with { RunId = Guid.NewGuid() }, CancellationToken.None));
        Assert.True(await second.TryClaimAsync(key with { RepositoryId = Guid.NewGuid() }, CancellationToken.None));
        Assert.True(await second.TryClaimAsync(key with { PullRequestId = 43 }, CancellationToken.None));

        async Task<bool> ClaimAsync(IAzureDevOpsThreadCreateClaimStore store)
        {
            await release.Task;

            return await store.TryClaimAsync(key, CancellationToken.None);
        }
    }
}
