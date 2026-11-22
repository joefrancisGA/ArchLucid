using ArchLucid.Host.Core.Health;

using Moq;

namespace ArchLucid.Host.Core.Tests.Health;

[Trait("Category", "Unit")]
public sealed class RedisProbeConnectionTests
{
    [Fact]
    public async Task ConnectAsync_disposes_connection_created_after_the_probe_is_cancelled()
    {
        using CancellationTokenSource cancellation = new();
        TaskCompletionSource<IDisposable> pending = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource disposed = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IDisposable> connection = new();
        connection.Setup(x => x.Dispose()).Callback(() => disposed.TrySetResult());

        Task<IDisposable> wait = RedisProbeConnection.ConnectAsync(() => pending.Task, cancellation.Token);
        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => wait);

        pending.SetResult(connection.Object);
        await disposed.Task.WaitAsync(TimeSpan.FromSeconds(5));
        connection.Verify(x => x.Dispose(), Times.Once);
    }

    [Fact]
    public async Task ConnectAsync_leaves_a_successful_connection_owned_by_the_caller()
    {
        Mock<IDisposable> connection = new();
        IDisposable result = await RedisProbeConnection.ConnectAsync(
            () => Task.FromResult(connection.Object), CancellationToken.None);

        Assert.Same(connection.Object, result);
        connection.Verify(x => x.Dispose(), Times.Never);
    }
}
