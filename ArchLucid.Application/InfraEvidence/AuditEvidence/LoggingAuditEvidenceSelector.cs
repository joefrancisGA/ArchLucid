using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class LoggingAuditEvidenceSelector : IAuditEvidenceSelector
{
    public AuditEvidenceSelectorDescriptorRecord Descriptor { get; } = new()
    {
        CollectorId = "logging-snapshot-selector",
        Version = "1.0.0",
        EvidenceTypesProduced = [AuditEvidenceTypeNames.Logging],
        RequiredAzurePermissions = ["Microsoft.Insights/diagnosticSettings/read"],
        SupportedResourceTypes = ["Microsoft.Insights/diagnosticSettings"],
        CollectionMethod = "AzureInventorySnapshot.Diagnostics",
        ExpectedCost = "low",
        ExpectedDuration = "snapshot-bound",
        FreshnessCharacteristics = "CapturedUtc on snapshot header",
    };

    public AuditEvidenceRequirementSelectionRecord Select(
        AzureInventorySnapshotDetailReadModel snapshot,
        AuditEvidenceRequirementRecord requirement)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(requirement);

        if (snapshot.Diagnostics.Count == 0)
        {
            return AuditEvidenceSelectorSupport.Insufficient(
                requirement,
                "Inventory snapshot does not contain diagnostic configuration rows.");
        }

        List<AuditEvidenceCandidateRecord> candidates = snapshot.Diagnostics
            .Select(diagnostic => new AuditEvidenceCandidateRecord
            {
                RequirementId = requirement.RequirementId,
                AzureResourceId = diagnostic.TargetAzureResourceId,
                EvidenceType = requirement.EvidenceType,
                Summary = $"Diagnostic {diagnostic.DiagnosticName} on {diagnostic.TargetAzureResourceId}",
                ProvenanceKind = ProvenanceKind.ObservedFact,
            })
            .ToList();

        return AuditEvidenceSelectorSupport.Collected(requirement, candidates);
    }
}
