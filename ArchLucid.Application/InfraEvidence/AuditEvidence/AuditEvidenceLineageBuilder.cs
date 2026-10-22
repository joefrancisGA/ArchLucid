using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

/// <summary>Builds deterministic audit evidence chain-of-custody nodes without LLM narration.</summary>
public static class AuditEvidenceLineageBuilder
{
    public static AuditEvidenceLineageEvidenceNode BuildEvidenceNode(
        AuditEvidenceSnapshotItemRecord snapshotItem,
        AuditEvidenceItemRecord? evaluationItem)
    {
        ArgumentNullException.ThrowIfNull(snapshotItem);

        List<string> missingLinks = [];
        bool hasResourceIdentity = snapshotItem.CloudResourceId is not null
            || !string.IsNullOrWhiteSpace(snapshotItem.AzureResourceId);

        if (!hasResourceIdentity)
            missingLinks.Add("CloudResourceId");

        if (string.IsNullOrWhiteSpace(snapshotItem.NormalizedPointer))
            missingLinks.Add("NormalizedEvidence");

        if (string.IsNullOrWhiteSpace(snapshotItem.RawPointer))
            missingLinks.Add("RawApiBlob");

        if (string.IsNullOrWhiteSpace(snapshotItem.CollectorVersion))
            missingLinks.Add("CollectorVersion");

        if (string.IsNullOrWhiteSpace(snapshotItem.SelectorVersion))
            missingLinks.Add("SelectorVersion");

        if (snapshotItem.CollectedUtc == default)
            missingLinks.Add("CollectedUtc");

        bool itemHashVerified = AuditEvidenceSnapshotHasher.HashesEqual(
            snapshotItem.EvidenceHashSha256,
            AuditEvidenceSnapshotHasher.ComputeItemHash(snapshotItem));

        if (!itemHashVerified)
            missingLinks.Add("EvidenceHash");

        bool linkComplete = missingLinks.Count == 0
            && snapshotItem.CollectionStatus == AuditEvidenceCollectionStatus.Collected;

        return new AuditEvidenceLineageEvidenceNode
        {
            EvidenceRowId = snapshotItem.EvidenceRowId,
            EvaluationEvidenceItemId = evaluationItem?.EvidenceItemId,
            CloudResourceId = snapshotItem.CloudResourceId,
            AzureResourceId = snapshotItem.AzureResourceId,
            NormalizedPointer = snapshotItem.NormalizedPointer,
            RawPointer = snapshotItem.RawPointer,
            ApiQueryId = snapshotItem.ApiQueryId,
            CollectedUtc = snapshotItem.CollectedUtc,
            CollectorVersion = snapshotItem.CollectorVersion,
            SelectorVersion = snapshotItem.SelectorVersion,
            LinkComplete = linkComplete,
            ItemHashVerified = itemHashVerified,
            MissingLinkKinds = missingLinks,
        };
    }

    public static bool IsReadyForPositiveCheckbox(
        AuditControlRecord control,
        AuditControlEvaluationRecord? evaluation,
        IReadOnlyList<AuditEvidenceLineageRequirementChain> requirementChains,
        bool snapshotHashVerified)
    {
        ArgumentNullException.ThrowIfNull(control);
        ArgumentNullException.ThrowIfNull(requirementChains);

        if (!snapshotHashVerified)
            return false;

        if (evaluation?.Outcome != AuditEvaluationOutcome.TechnicallySupported)
            return false;

        if (requirementChains.Count == 0)
            return false;

        foreach (AuditEvidenceLineageRequirementChain chain in requirementChains)
        {
            if (chain.Evidence.Count == 0)
                return false;

            if (chain.Evidence.Any(evidence => !evidence.LinkComplete || !evidence.ItemHashVerified))
                return false;
        }

        return true;
    }
}
