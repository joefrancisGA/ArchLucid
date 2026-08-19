namespace ArchLucid.Core.Audit;

// Pilot scorecards, sponsor evidence delivery, and pilot team onboarding checkpoints.
public static partial class AuditEventTypes
{
    /// <summary>Operator set pilot scorecard ROI baselines (<c>PUT /v1/pilots/scorecard/baselines</c>).</summary>
    public const string PilotScorecardBaselinesUpdated = "PilotScorecardBaselinesUpdated";

    /// <summary>Operator submitted pilot value metrics via <c>POST /v1/pilots/scorecard</c>.</summary>
    public const string PilotScorecardValueMetricsSubmitted = "PilotScorecardValueMetricsSubmitted";

    /// <summary>Optional structured pilot closeout (<c>POST /v1/pilots/closeout</c>).</summary>
    public const string PilotCloseoutRecorded = "PilotCloseoutRecorded";

    /// <summary>Operator generated the one-click sponsor proof ZIP for a committed run (Batch B item 5).</summary>
    public const string SponsorProofPackGenerated = "SponsorProofPackGenerated";

    /// <summary>Operator marked sponsor evidence as delivered (<c>POST /v1/pilots/runs/{runId}/sponsor-pack-sent</c>, TB-243).</summary>
    public const string SponsorEvidencePackSent = "SponsorEvidencePackSent";

    /// <summary>
    ///     Operator shared a preliminary architecture draft with sponsors before commit (
    ///     <c>POST /v1/pilots/runs/{runId}/sponsor-preliminary-share</c>).
    /// </summary>
    public const string SponsorPreliminaryArchitectureShared = "SponsorPreliminaryArchitectureShared";

    /// <summary>Core Pilot team checklist step upsert (<c>PUT …/tenant/core-pilot-checklist</c>).</summary>
    public const string CorePilotTeamChecklistUpdated = "CorePilotTeamChecklistUpdated";
}
