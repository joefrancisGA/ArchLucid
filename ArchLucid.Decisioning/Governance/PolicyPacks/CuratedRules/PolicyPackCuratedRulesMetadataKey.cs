namespace ArchLucid.Decisioning.Governance.PolicyPacks.CuratedRules;

/// <summary>
///     Reserved <see cref="PolicyPackContentDocument.Metadata" /> entry storing the canonical curated-rules JSON document
///     (<c>*-rules-v1.json</c> sample shape) as a single string payload.
/// </summary>
public static class PolicyPackCuratedRulesMetadataKey
{
    /// <summary>Metadata key agreed for V1 tenant-authored rule bodies (UI + decisioning share this shape).</summary>
    public const string V1 = "pack.curatedRules.v1";
}
