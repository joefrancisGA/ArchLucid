using System.Text;

using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditEvidencePackageProjectionContext
{
    public AuditAssessmentRecord Assessment
    {
        get;
        init;
    } = null!;

    public AuditFrameworkRecord Framework
    {
        get;
        init;
    } = null!;

    public AuditEvidenceSnapshotHeaderRecord SnapshotHeader
    {
        get;
        init;
    } = null!;

    public IReadOnlyList<AuditControlRecord> Controls
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AuditEvidenceRequirementRecord> Requirements
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AuditEvidenceSnapshotItemRecord> SnapshotItems
    {
        get;
        init;
    } = [];

    public IReadOnlyDictionary<Guid, AuditControlEvaluationRecord> EvaluationsByControlId
    {
        get;
        init;
    } = new Dictionary<Guid, AuditControlEvaluationRecord>();

    public IReadOnlyList<AuditManualEvidenceSubmissionRecord> ManualSubmissions
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AuditArchitectureEvidenceLinkRecord> ArchitectureLinks
    {
        get;
        init;
    } = [];

    public AuditAssessmentReadinessSummaryRecord ReadinessSummary
    {
        get;
        init;
    } = null!;

    public IReadOnlyDictionary<Guid, AuditHybridControlEvidenceRecord> HybridByControlId
    {
        get;
        init;
    } = new Dictionary<Guid, AuditHybridControlEvidenceRecord>();

    public IReadOnlyList<AuditEvidenceSelectorDescriptorRecord> SelectorDescriptors
    {
        get;
        init;
    } = [];

    public string? BrandingDisplayName
    {
        get;
        init;
    }

    public IReadOnlyDictionary<string, string?> ManualBlobContentByPointer
    {
        get;
        init;
    } = new Dictionary<string, string?>();
}
