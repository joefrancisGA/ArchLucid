namespace ArchLucid.Core.Configuration;

/// <summary>Surfaces whether the host is using durable SQL persistence or in-memory substitutes.</summary>
public interface IArchLucidStorageMode
{
    /// <summary>True when relational reconciliation and SQL probes should no-op (tests / local in-memory).</summary>
    bool IsInMemory
    {
        get;
    }
}
