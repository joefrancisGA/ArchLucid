using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class InMemoryOperatorSavedViewRepositoryTests
{
    [Fact]
    public async Task Concurrent_creates_allow_only_one_view_with_the_same_name()
    {
        InMemoryOperatorSavedViewRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        TaskCompletionSource start = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Task<bool>[] creates = Enumerable.Range(0, 16).Select(async _ =>
        {
            await start.Task;
            try
            {
                return await repository.CreateAsync(
                    tenantId, "operator", "audit", "Recent activity", "{}", null, false, CancellationToken.None) is not null;
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("already exists", StringComparison.Ordinal))
            {
                return false;
            }
        }).ToArray();

        start.SetResult();
        bool[] outcomes = await Task.WhenAll(creates);

        Assert.Single(outcomes, static created => created);
        Assert.Single(await repository.ListAsync(tenantId, "operator", "audit", CancellationToken.None));
    }
}
