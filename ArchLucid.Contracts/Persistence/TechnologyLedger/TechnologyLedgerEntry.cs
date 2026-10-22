using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Persistence.TechnologyLedger;

/// <summary>
///     A single canonical technology fact for an architecture run: which technology fills a given
///     architectural <see cref="Role" />, its provider family, approval status, and where it came from.
///     This is the additive data-model foundation for cross-agent technology consistency; nothing in the
///     generation pipeline reads or writes it yet (see docs/architecture/ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md).
/// </summary>
public sealed class TechnologyLedgerEntry
{
    /// <summary>Unique identifier for this ledger entry.</summary>
    public string EntryId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    /// <summary>The architecture run this entry belongs to.</summary>
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    /// <summary>The architectural role this entry fills.</summary>
    public TechnologyLedgerRole Role
    {
        get;
        set;
    }

    /// <summary>The technology, service, or platform name (e.g. "Azure SQL Database", "PostgreSQL", "Amazon RDS").</summary>
    public string TechnologyName
    {
        get;
        set;
    } = string.Empty;

    /// <summary>
    ///     The cloud provider family this technology belongs to. Use <see cref="CloudProvider.None" /> for
    ///     provider-agnostic entries (e.g. a generic role name under a cloud-neutral posture).
    /// </summary>
    public CloudProvider ProviderFamily
    {
        get;
        set;
    }

    /// <summary>Approval status of this entry.</summary>
    public TechnologyLedgerStatus Status
    {
        get;
        set;
    }

    /// <summary>Origin of this entry.</summary>
    public TechnologyLedgerSource Source
    {
        get;
        set;
    }

    /// <summary>
    ///     Citation or reference id grounding this entry, set when <see cref="Source" /> is
    ///     <see cref="TechnologyLedgerSource.Evidence" /> or the entry is otherwise grounded; <see langword="null" /> when
    ///     not yet grounded.
    /// </summary>
    public string? EvidenceRef
    {
        get;
        set;
    }

    /// <summary>Free-text explanation of why this technology was chosen or proposed.</summary>
    public string? Rationale
    {
        get;
        set;
    }

    /// <summary>
    ///     When <see langword="true" />, this entry should not be overwritten by a later agent proposal without an
    ///     explicit human action. Not yet enforced anywhere in the pipeline — persisted for a future wiring step.
    /// </summary>
    public bool IsLocked
    {
        get;
        set;
    }

    /// <summary>UTC timestamp when this entry was created.</summary>
    public DateTime CreatedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    /// <summary>UTC timestamp when this entry was last updated.</summary>
    public DateTime UpdatedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;
}
