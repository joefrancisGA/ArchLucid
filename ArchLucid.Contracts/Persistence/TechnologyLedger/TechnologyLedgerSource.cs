namespace ArchLucid.Contracts.Persistence.TechnologyLedger;

/// <summary>Origin of a <see cref="TechnologyLedgerEntry" />.</summary>
public enum TechnologyLedgerSource
{
    /// <summary>Recorded from an explicit intake answer or user action.</summary>
    User = 0,

    /// <summary>Derived from uploaded evidence (IaC declarations, cloud inventory, documents).</summary>
    Evidence = 1,

    /// <summary>Introduced by an agent during architecture generation.</summary>
    AgentProposed = 2,
}
