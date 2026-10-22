using ArchLucid.Persistence.Audit;
using ArchLucid.TestSupport;

using FluentAssertions;

using Polly;

namespace ArchLucid.Persistence.Tests.Audit;

[Trait("Category", "Unit")]
public sealed class AuditSqlRetryPolicyProviderTests
{
    [Fact]
    public async Task GetRetryPolicy_RetriesTransientSqlException()
    {
        AuditSqlRetryPolicyProvider provider = new();
        IAsyncPolicy policy = provider.GetRetryPolicy();
        int attempts = 0;

        Func<Task> action = () =>
        {
            attempts++;
            return Task.FromException(SqlExceptionTestFactory.Create(40613));
        };

        Func<Task> act = async () => await policy.ExecuteAsync(action);
        
        await act.Should().ThrowAsync<Microsoft.Data.SqlClient.SqlException>();
        attempts.Should().Be(4);
    }
}
