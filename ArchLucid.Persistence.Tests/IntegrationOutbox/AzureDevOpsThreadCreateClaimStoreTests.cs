using ArchLucid.Core.Integration;
using ArchLucid.Persistence.IntegrationOutbox;

namespace ArchLucid.Persistence.Tests.IntegrationOutbox;

[Trait("Category", "Unit")]
public sealed class AzureDevOpsThreadCreateClaimStoreTests
{
    [Fact]
    public async Task In_memory_claims_are_single_winner_and_isolated_by_the_entire_key()
    {
        InMemoryAzureDevOpsThreadCreateClaimStore store = new();
        await AzureDevOpsThreadClaimStoreContract.VerifyAsync(store, store);
    }
}
