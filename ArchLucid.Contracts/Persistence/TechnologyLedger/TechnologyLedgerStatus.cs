namespace ArchLucid.Contracts.Persistence.TechnologyLedger;

/// <summary>Approval status of a <see cref="TechnologyLedgerEntry" />.</summary>
public enum TechnologyLedgerStatus
{
    /// <summary>User- or evidence-confirmed and authoritative for its <see cref="TechnologyLedgerEntry.Role" />.</summary>
    Chosen = 0,

    /// <summary>Agent-proposed during generation; not yet approved by a human.</summary>
    Assumed = 1,

    /// <summary>An explicitly labeled option under consideration; never the active choice for its role.</summary>
    Alternative = 2,

    /// <summary>Roadmap or out-of-scope-for-this-run; not part of the current design.</summary>
    Future = 3,
}
