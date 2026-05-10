namespace ArchLucid.Contracts.Audit;

/// <summary>
///     Stable buyer-facing titles + lifecycle grouping for durable audit event type strings (mirror literals from
///     <c>ArchLucid.Core.Audit.AuditEventTypes</c> where applicable).
/// </summary>
public static class AuditEventPresentation
{
    /// <summary>
    ///     Returns a reviewer-facing title suitable for sponsor timelines — falls back to the trimmed raw code when unknown.
    /// </summary>
    public static string FriendlyTitle(string eventType)
    {
        string key = eventType.Trim();

        if (key.Length == 0)
        {
            return "Event";
        }

        return key switch
        {
            "RunStarted" => "Review started",

            "RunSubmitted" => "Review submitted",

            "RunCompleted" => "Review completed",

            "Request.Created" => "Architecture request captured",

            "ManifestGenerated" => "Manifest generated",

            "ManifestFinalized" => "Manifest finalized",

            "ManifestViewed" => "Manifest viewed",

            "ReviewTrailAccessed" => "Review trail accessed",

            "ProvenanceAccessed" => "Evidence graph accessed",

            "FindingsListAccessed" => "Findings reviewed",

            "FindingsSnapshotSealed" => "Findings captured",

            "ArtifactsGenerated" => "Artifacts bundled",

            "GovernanceApprovalRequested" => "Governance approval requested",

            _ => HumanizeUnknown(key),
        };
    }

    /// <summary>
    ///     Maps known audit codes into coarse lifecycle stages for grouping Activity vs Audit surfaces consistently.
    /// </summary>
    public static ReviewAuditLifecycleStage LifecycleStage(string eventType)
    {
        string key = eventType.Trim();

        return key switch
        {
            "RunStarted" or "RunSubmitted" => ReviewAuditLifecycleStage.ReviewStarted,

            "Request.Created" => ReviewAuditLifecycleStage.ContextCaptured,

            "ReviewTrailAccessed" or "ProvenanceAccessed" => ReviewAuditLifecycleStage.GraphCreated,

            "FindingsListAccessed" or "FindingsSnapshotSealed" => ReviewAuditLifecycleStage.FindingsCaptured,

            "ManifestGenerated" or "ManifestFinalized" or "ManifestViewed" => ReviewAuditLifecycleStage.ManifestFinalized,

            "ArtifactsGenerated" => ReviewAuditLifecycleStage.ArtifactsBundled,

            "GovernanceApprovalRequested" => ReviewAuditLifecycleStage.GovernanceHandoff,

            _ => ReviewAuditLifecycleStage.Other,
        };
    }

    private static string HumanizeUnknown(string raw)
    {
        string[] parts = raw.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        string last = parts.Length > 0 ? parts[^1] : raw;

        string[] words = last
            .Replace('-', ' ')
            .Replace('_', ' ')
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (words.Length == 0)
        {
            return raw;
        }

        IEnumerable<string> titled = words.Select(static w =>
            w.Length == 0 ? string.Empty : char.ToUpperInvariant(w[0]) + (w.Length > 1 ? w[1..].ToLowerInvariant() : string.Empty));

        return string.Join(' ', titled);
    }
}
