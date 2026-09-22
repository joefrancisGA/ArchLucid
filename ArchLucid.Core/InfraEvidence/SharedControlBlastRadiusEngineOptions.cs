namespace ArchLucid.Core.InfraEvidence;

/// <summary>Minimum cited dependents before a shared control emits a blast-radius path (SA-08).</summary>
public sealed class SharedControlBlastRadiusEngineOptions
{
    public const int DefaultMinSharedDependents = 2;

    public int MinSharedDependents
    {
        get;
        init;
    } = DefaultMinSharedDependents;
}
