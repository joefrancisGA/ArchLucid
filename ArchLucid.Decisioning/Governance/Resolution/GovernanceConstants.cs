namespace ArchLucid.Decisioning.Governance.Resolution;

/// <summary>
///     Canonical tokens for effective governance resolution: facet item types, conflict kinds, precedence tiers, and
///     operator-facing messages emitted by <see cref="EffectiveGovernanceResolver" />.
/// </summary>
/// <remarks>
///     Centralizes literals previously scattered in <see cref="EffectiveGovernanceResolver" /> so API consumers, tests, and
///     UI layers can reference the same strings without silent drift.
/// </remarks>
public static class GovernanceConstants
{
    /// <summary>Facet names stored on <see cref="GovernanceResolutionDecision.ItemType" /> and conflict records.</summary>
    public static class ItemTypes
    {
        public const string ComplianceRule = "ComplianceRule";
        public const string ComplianceRuleKey = "ComplianceRuleKey";
        public const string AlertRule = "AlertRule";
        public const string CompositeAlertRule = "CompositeAlertRule";
        public const string AdvisoryDefault = "AdvisoryDefault";
        public const string Metadata = "Metadata";
    }

    /// <summary>Conflict classification tokens on <see cref="GovernanceConflictRecord.ConflictType" />.</summary>
    public static class ConflictTypes
    {
        public const string DuplicateDefinition = "DuplicateDefinition";
        public const string ValueConflict = "ValueConflict";
    }

    /// <summary>
    ///     Base precedence ranks for <see cref="GovernanceScopeLevel" /> tiers; pin boost is added separately in
    ///     <see cref="EffectiveGovernanceResolver.GetPrecedenceRank" />.
    /// </summary>
    public static class PrecedenceTiers
    {
        public const int Tenant = 1000;
        public const int Workspace = 2000;
        public const int Project = 3000;
        public const int PinnedBoost = 100;
    }

    /// <summary>Human-readable explanations appended to <see cref="GovernanceResolutionDecision.ResolutionReason" />.</summary>
    public static class ResolutionReasons
    {
        public const string NoCandidates = "No candidates.";
        public const string SingleCandidate = "Only one applicable candidate existed.";

        public const string HigherScopeTier =
            "Higher governance scope tier (project > workspace > tenant), or pinned assignment within a tier, outranked the other candidate(s).";

        public const string SameTierNewerAssignment =
            "Same scope tier and pin state; the newer assignment (AssignedUtc) won.";

        public const string SameTierTieBreak =
            "Same scope tier, pin state, and timestamp; winner chosen by deterministic tie-break (AssignmentId).";
    }

    /// <summary>Operator notes and conflict descriptions appended during <see cref="EffectiveGovernanceResolver.ResolveAsync" />.</summary>
    public static class Notes
    {
        public const string SkippedPackNotFound = "Skipped assignment for policy pack '{0}': pack not found.";

        public const string SkippedVersionNotFound =
            "Skipped policy pack '{0}' ({1}): version '{2}' not found.";

        public const string SkippedCorruptJson =
            "Skipped policy pack '{0}' ({1}) version '{2}': content JSON is corrupt ({3}).";

        public const string SkippedNullContent =
            "Skipped policy pack '{0}' ({1}) version '{2}': content deserialized to null.";

        public const string ResolvedAssignmentCount = "Resolved {0} applicable policy pack assignment(s).";
        public const string ProducedDecisionCount = "Produced {0} resolution decision(s).";
        public const string DetectedConflictCount = "Detected {0} conflict(s).";

        public const string DuplicateDefinitionItem =
            "Multiple policy packs defined the same {0} item. The higher-precedence candidate was selected.";

        public const string DuplicateDefinitionKey =
            "Multiple policy packs defined the same {0} key. The higher-precedence candidate was selected.";

        public const string ValueConflict =
            "Multiple policy packs defined different values for {0} '{1}'. The higher-precedence value was selected.";
    }
}
