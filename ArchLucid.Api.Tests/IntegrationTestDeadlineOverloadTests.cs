using System.Reflection;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
public sealed class IntegrationTestDeadlineOverloadTests
{
    [Fact]
    public async Task RunAsync_when_body_exceeds_deadline_records_shard_overload_flag()
    {
        ResetShardWarmupTimedOutFlag();

        Func<Task> act = () => IntegrationTestDeadline.RunAsync(
            nameof(RunAsync_when_body_exceeds_deadline_records_shard_overload_flag),
            async _ => await Task.Delay(TimeSpan.FromMinutes(10)),
            TimeSpan.FromMilliseconds(50));

        await act.Should().ThrowAsync<TimeoutException>();

        GreenfieldSqlIntegrationWarmup.ShardWarmupTimedOut.Should().BeTrue();
    }

    private static void ResetShardWarmupTimedOutFlag()
    {
        FieldInfo? field = typeof(GreenfieldSqlIntegrationWarmup).GetField(
            "_shardWarmupTimedOut",
            BindingFlags.Static | BindingFlags.NonPublic);

        field.Should().NotBeNull();
        field!.SetValue(null, 0);
    }
}
