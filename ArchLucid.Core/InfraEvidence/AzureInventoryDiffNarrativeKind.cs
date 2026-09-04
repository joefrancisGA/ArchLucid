namespace ArchLucid.Core.InfraEvidence;

/// <summary>LLM narrative category over a persisted inventory diff.</summary>
public enum AzureInventoryDiffNarrativeKind
{
    Material = 0,
    Security = 1,
    Architecture = 2,
    Accidental = 3,
    Investigate = 4,
}
