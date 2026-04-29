namespace ArchLucid.ArtifactSynthesis.Models;

/// <summary>Lifecycle of a synthesized artifact bundle at rest.</summary>
public enum ArtifactBundleStatus
{
    Pending = 1,
    Available = 2,
    Partial = 3,
    Failed = 4,
    Archived = 5
}
