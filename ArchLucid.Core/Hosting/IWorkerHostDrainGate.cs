namespace ArchLucid.Core.Hosting;

/// <summary>
///     Process-wide admission gate flipped on <c>ApplicationStopping</c> so execute ownership and new work
///     are not claimed while the host drains (TB-961).
/// </summary>
public interface IWorkerHostDrainGate
{
    bool IsDraining { get; }

    void BeginDrain();
}
