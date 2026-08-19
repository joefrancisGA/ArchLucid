namespace ArchLucid.Core.Authority;

/// <summary>Selects which orchestration substrate executes the authority pipeline.</summary>
public enum OrchestratorBackend
{
    /// <summary>Hand-rolled SQL-backed state machine (current default).</summary>
    Legacy,

    /// <summary>Durable Task Framework with SQL Server storage backend.</summary>
    DurableTask
}
