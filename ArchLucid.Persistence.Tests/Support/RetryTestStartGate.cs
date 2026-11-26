namespace ArchLucid.Persistence.Tests.Support;

internal static class RetryTestStartGate
{
    internal static async Task<T[]> RunTogetherAsync<T>(
        int count, Func<int, CancellationToken, Task<T>> operation)
    {
        using CancellationTokenSource timeout = new(TimeSpan.FromSeconds(30));
        TaskCompletionSource start = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Task<T>[] attempts = Enumerable.Range(0, count).Select(RunAsync).ToArray();

        start.SetResult();
        return await Task.WhenAll(attempts).WaitAsync(timeout.Token);

        async Task<T> RunAsync(int index)
        {
            await start.Task;
            return await operation(index, timeout.Token);
        }
    }
}
