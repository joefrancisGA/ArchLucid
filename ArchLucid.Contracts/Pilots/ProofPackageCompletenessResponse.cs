namespace ArchLucid.Contracts.Pilots;

/// <summary>
///     Deterministic proof-package checklist aligned with the first-value Markdown/PDF (same persisted inputs as the
///     buyer-safe gate). Missing inputs surface as incomplete flags — nothing is invented server-side.
/// </summary>
public sealed class ProofPackageCompletenessResponse
{
    /// <summary>True when <see cref="PilotRunDeltasResponse.IsDemoTenant" /> requires non-negotiable demo warnings.</summary>
    public bool DemoTenantWarningRequired
    {
        get;
        init;
    }

    /// <summary>Non-empty support / review run id on the persisted <c>ArchitectureRun</c> row.</summary>
    public bool SupportRunIdPresent
    {
        get;
        init;
    }

    /// <summary>Golden manifest present on the run detail aggregate.</summary>
    public bool CommittedManifestPresent
    {
        get;
        init;
    }

    /// <summary>Run status is <c>Committed</c> alongside a loaded manifest reference.</summary>
    public bool RunInCommittedStatus
    {
        get;
        init;
    }

    /// <summary>
    ///     Count of synthesized artifact descriptors when the SQL artifact query succeeded; otherwise <see langword="null" />.
    /// </summary>
    public int? ArtifactDescriptorCount
    {
        get;
        init;
    }

    /// <summary>
    ///     <see langword="true" /> when <see cref="ArtifactDescriptorCount" /> came from a resolved golden-manifest id query.
    /// </summary>
    public bool ArtifactDescriptorCountResolved
    {
        get;
        init;
    }

    /// <summary>Wall-clock commit interval computed from persisted timestamps.</summary>
    public bool TimeToCommittedManifestResolved
    {
        get;
        init;
    }

    /// <summary>At least one findings-by-severity bucket on agent results.</summary>
    public bool FindingsBySeverityPresent
    {
        get;
        init;
    }

    /// <summary>Either no top finding was chosen or its evidence-chain pointers resolved.</summary>
    public bool TopFindingEvidenceChainPresentOrNotApplicable
    {
        get;
        init;
    }

    /// <summary>Audit query returned rows or a capped lower-bound (&gt; 0 rows within cap).</summary>
    public bool AuditRowsPresentOrLowerBound
    {
        get;
        init;
    }

    /// <summary>Per-run LLM completion rows counted from execution traces.</summary>
    public int LlmCallCount
    {
        get;
        init;
    }

    /// <summary>
    ///     Mirrors <see cref="PilotRunDeltasResponse.LlmCallCountResolved" /> — false means the count is not attested.
    /// </summary>
    public bool LlmCallCountResolved
    {
        get;
        init;
    }

    /// <summary>Tier for comparative ROI narrative (tenant baseline posture).</summary>
    public PilotRoiEvidenceConfidence RoiEvidenceConfidence
    {
        get;
        init;
    }

    /// <summary>Human-readable ROI baseline posture for the tenant value window.</summary>
    public string RoiConfidenceLabel
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Which external-sharing redaction posture applies (demo vs tenant export).</summary>
    public string BuyerSafeRedactionProfile
    {
        get;
        init;
    } = string.Empty;

    /// <summary>
    ///     Publishing posture label: <c>Complete</c>, <c>Partial</c>, or <c>DemoOnly</c> (demo tenant or structural hard gaps).
    /// </summary>
    public string PublishingTier
    {
        get;
        init;
    } = string.Empty;

    /// <summary>
    ///     When PilotStrict mode is enabled server-side and trace queries resolve, false means sponsor-sendable posture failed.
    /// </summary>
    public bool AgentOutputPilotStrictEvidenceSatisfied
    {
        get;
        init;
    } = true;

    /// <summary>
    ///     Sendability label: <c>Sendable</c>, <c>SendableWithCaveats</c>, or <c>NotSendable</c>.
    /// </summary>
    public string ProofSendability
    {
        get;
        init;
    } = string.Empty;

    /// <summary><c>Strong</c>, <c>Partial</c>, or <c>Incomplete</c> — mirrors <see cref="FirstValueEvidenceCompletenessLevel" />.</summary>
    public string EvidenceCompleteness
    {
        get;
        init;
    } = string.Empty;
}
