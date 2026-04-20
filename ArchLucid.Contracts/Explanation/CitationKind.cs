using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Explanation;

/// <summary>Persisted artifact class cited by operator-facing explanation responses.</summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CitationKind
{
    /// <summary>Golden manifest row (<c>dbo.GoldenManifests.ManifestId</c>).</summary>
    Manifest = 0,

    /// <summary>Single finding from a findings snapshot (<c>Finding.FindingId</c> string).</summary>
    Finding = 1,

    /// <summary>Authority decision trace (<c>DecisionTraceId</c> on the manifest).</summary>
    DecisionTrace = 2,

    /// <summary>Synthesized artifact bundle (<c>ArtifactBundle.BundleId</c>) when present.</summary>
    EvidenceBundle = 3,

    /// <summary>Knowledge graph snapshot id carried on the manifest.</summary>
    GraphSnapshot = 4,

    /// <summary>Context ingestion snapshot id carried on the manifest.</summary>
    ContextSnapshot = 5,
}
