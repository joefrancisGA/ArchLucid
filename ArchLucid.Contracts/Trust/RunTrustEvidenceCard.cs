using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Trust;

/// <summary>
///     Read model for committed runs: self-attested operational evidence (audit, traces, exports). Not CPA SOC 2,
///     penetration testing, or legal attestation.
/// </summary>
public sealed class RunTrustEvidenceCard
{
    public string SelfAttestationNotice
    {
        get;
        set;
    } = string.Empty;

    private TrustEvidenceFieldSnapshot executionMode = new();

    public TrustEvidenceFieldSnapshot ExecutionMode
    {
        get => executionMode;
        set => executionMode = value ?? new TrustEvidenceFieldSnapshot();
    }

    private TrustEvidenceFieldSnapshot goldenManifest = new();

    public TrustEvidenceFieldSnapshot GoldenManifest
    {
        get => goldenManifest;
        set => goldenManifest = value ?? new TrustEvidenceFieldSnapshot();
    }

    private TrustEvidenceFieldSnapshot auditTrail = new();

    public TrustEvidenceFieldSnapshot AuditTrail
    {
        get => auditTrail;
        set => auditTrail = value ?? new TrustEvidenceFieldSnapshot();
    }

    private TrustEvidenceFieldSnapshot agentTraces = new();

    public TrustEvidenceFieldSnapshot AgentTraces
    {
        get => agentTraces;
        set => agentTraces = value ?? new TrustEvidenceFieldSnapshot();
    }

    private TrustEvidenceFieldSnapshot artifactBundlePointer = new();

    public TrustEvidenceFieldSnapshot ArtifactBundlePointer
    {
        get => artifactBundlePointer;
        set => artifactBundlePointer = value ?? new TrustEvidenceFieldSnapshot();
    }

    private TrustEvidenceFieldSnapshot traceabilityExport = new();

    public TrustEvidenceFieldSnapshot TraceabilityExport
    {
        get => traceabilityExport;
        set => traceabilityExport = value ?? new TrustEvidenceFieldSnapshot();
    }

    private TrustEvidenceFieldSnapshot aiExplainability = new();

    public TrustEvidenceFieldSnapshot AiExplainability
    {
        get => aiExplainability;
        set => aiExplainability = value ?? new TrustEvidenceFieldSnapshot();
    }

    public RunTrustEvidenceTopFindingRow? TopFinding
    {
        get;
        set;
    }

    private List<RunTrustEvidenceRouteRef> links = [];

    public List<RunTrustEvidenceRouteRef> Links
    {
        get => links;
        set => links = ContractCollectionDefaults.Coalesce(value);
    }
}
