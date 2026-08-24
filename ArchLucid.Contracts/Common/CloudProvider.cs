using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Common;

/// <summary>Identifies the target cloud platform for an architecture run.</summary>
[JsonConverter(typeof(CloudProviderJsonConverter))]
public enum CloudProvider
{
    /// <summary>No cloud provider — evidence-only architecture review (brief, docs, diagrams, IaC).</summary>
    None = 0,

    /// <summary>Microsoft Azure — V1 deep cloud-analysis provider.</summary>
    Azure = 1,

    /// <summary>Amazon Web Services — Phase 1 intent capture; deep cloud-aware analysis ships in V1.1.</summary>
    Aws = 2,

    /// <summary>Google Cloud Platform — Phase 1 intent capture; deep cloud-aware analysis ships in V1.1.</summary>
    Gcp = 3,
}
