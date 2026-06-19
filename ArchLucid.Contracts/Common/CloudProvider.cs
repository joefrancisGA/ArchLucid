namespace ArchLucid.Contracts.Common;

/// <summary>Identifies the target cloud platform for an architecture run.</summary>
public enum CloudProvider
{
    /// <summary>No cloud provider — evidence-only architecture review (brief, docs, diagrams, IaC).</summary>
    None = 0,

    /// <summary>Microsoft Azure — V1 deep cloud-analysis provider.</summary>
    Azure = 1,
}
