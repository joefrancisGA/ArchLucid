namespace ArchLucid.Core.Hosting;

/// <inheritdoc cref="IWorkerHostDrainGate" />
public sealed class WorkerHostDrainGate : IWorkerHostDrainGate
{
    private int _draining;

    /// <inheritdoc />
    public bool IsDraining => Volatile.Read(ref _draining) != 0;

    /// <inheritdoc />
    public void BeginDrain() => Volatile.Write(ref _draining, 1);
}
