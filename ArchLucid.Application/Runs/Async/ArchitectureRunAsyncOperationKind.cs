namespace ArchLucid.Application.Runs.Async;

/// <summary>Background work accepted by async execute/replay siblings (TB-2075).</summary>
public enum ArchitectureRunAsyncOperationKind
{
    Execute = 0,
    Replay = 1
}
