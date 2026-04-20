namespace ArchLucid.Host.Core.Configuration;

/// <summary>How to act on orphan-row detection beyond emitting the detection counter.</summary>
public enum DataConsistencyEnforcementMode
{
    /// <summary>No alert or quarantine side effects (detection counter still records when probe runs).</summary>
    Off = 0,

    /// <summary>Structured logs only (same as historical default behaviour before explicit enforcement).</summary>
    Warn = 1,

    /// <summary>Emit <c>archlucid_data_consistency_alerts_total</c> when orphans exist.</summary>
    Alert = 2,

    /// <summary>Insert orphan golden-manifest rows into <c>dbo.DataConsistencyQuarantine</c> (limited batch).</summary>
    Quarantine = 3,
}
