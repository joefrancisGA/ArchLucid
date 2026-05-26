using ArchLucid.Persistence.Audit;
using ArchLucid.TestSupport;

using FluentAssertions;

using Polly;

namespace ArchLucid.Persistence.Tests.Audit;

[Trait("Category", "Unit")]
public sealed class AuditSqlRetryPolicyProviderTests
{
    [Fact]
    public void GetRetryPolicy_RetriesTransientSqlException()
    {
        AuditSqlRetryPolicyProvider provider = new();
        IAsyncPolicy policy = provider.GetRetryPolicy();
        int attempts = 0;

        Func<Task> action = async () =>
        {
            attempts++;

            await Task.CompletedTask;

            throw SqlExceptionTestFactory.Create(40613);
        };

        Func<Task> act = async () =>
        {
            await policy.ExecuteAsync(async _ => await action(), CancellationToken.None);
        };
        
        act.Should().ThrowAsync<Microsoft.Data.SqlClient.SqlException>().GetAwaiter().GetResult();
        attempts.Should().Be(4);
    }
}
