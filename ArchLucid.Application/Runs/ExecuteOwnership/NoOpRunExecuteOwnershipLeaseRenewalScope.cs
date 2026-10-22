namespace ArchLucid.Application.Runs.ExecuteOwnership;

/// <summary>No-op <see cref="IAsyncDisposable" /> for disabled execute ownership leasing.</summary>
internal sealed class NoOpRunExecuteOwnershipLeaseRenewalScope : IAsyncDisposable
{
    public static readonly NoOpRunExecuteOwnershipLeaseRenewalScope Instance = new();

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}
