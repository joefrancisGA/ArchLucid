namespace ArchLucid.Contracts.Persistence.Artifacts;

/// <summary>Per-artifact generation outcome inside a bundle.</summary>
public enum SynthesizedArtifactGenerationStatus
{
    Pending = 1,
    Generated = 2,
    Failed = 3
}

