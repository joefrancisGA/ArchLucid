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

    public TrustEvidenceFieldSnapshot ExecutionMode
    {
        get;
        set;
    } = new();

    public TrustEvidenceFieldSnapshot GoldenManifest
    {
        get;
        set;
    } = new();

    public TrustEvidenceFieldSnapshot AuditTrail
    {
        get;
        set;
    } = new();

    public TrustEvidenceFieldSnapshot AgentTraces
    {
        get;
        set;
    } = new();

    public TrustEvidenceFieldSnapshot ArtifactBundlePointer
    {
        get;
        set;
    } = new();

    public TrustEvidenceFieldSnapshot TraceabilityExport
    {
        get;
        set;
    } = new();

    public TrustEvidenceFieldSnapshot AiExplainability
    {
        get;
        set;
    } = new();

    public RunTrustEvidenceTopFindingRow? TopFinding
    {
        get;
        set;
    }

    public List<RunTrustEvidenceRouteRef> Links
    {
        get;
        set;
    } = [];
}
