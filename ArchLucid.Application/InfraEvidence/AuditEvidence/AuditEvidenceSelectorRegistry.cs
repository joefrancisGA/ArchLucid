using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditEvidenceSelectorRegistry : IAuditEvidenceSelectorRegistry
{
    private readonly Dictionary<string, IAuditEvidenceSelector> _selectorsByType;

    public AuditEvidenceSelectorRegistry(
        InventoryAuditEvidenceSelector inventorySelector,
        IdentityAuditEvidenceSelector identitySelector,
        RbacAuditEvidenceSelector rbacSelector,
        NetworkAuditEvidenceSelector networkSelector,
        DataAuditEvidenceSelector dataSelector,
        LoggingAuditEvidenceSelector loggingSelector,
        GovernanceAuditEvidenceSelector governanceSelector,
        PostureAuditEvidenceSelector postureSelector,
        ResilienceAuditEvidenceSelector resilienceSelector)
    {
        ArgumentNullException.ThrowIfNull(inventorySelector);
        ArgumentNullException.ThrowIfNull(identitySelector);
        ArgumentNullException.ThrowIfNull(rbacSelector);
        ArgumentNullException.ThrowIfNull(networkSelector);
        ArgumentNullException.ThrowIfNull(dataSelector);
        ArgumentNullException.ThrowIfNull(loggingSelector);
        ArgumentNullException.ThrowIfNull(governanceSelector);
        ArgumentNullException.ThrowIfNull(postureSelector);
        ArgumentNullException.ThrowIfNull(resilienceSelector);

        IAuditEvidenceSelector[] selectors =
        [
            inventorySelector,
            identitySelector,
            rbacSelector,
            networkSelector,
            dataSelector,
            loggingSelector,
            governanceSelector,
            postureSelector,
            resilienceSelector,
        ];

        _selectorsByType = selectors
            .SelectMany(selector => selector.Descriptor.EvidenceTypesProduced
                .Select(type => new KeyValuePair<string, IAuditEvidenceSelector>(type.ToLowerInvariant(), selector)))
            .ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.OrdinalIgnoreCase);
    }

    public IReadOnlyList<AuditEvidenceSelectorDescriptorRecord> ListDescriptors() =>
        _selectorsByType.Values
            .Distinct()
            .Select(selector => selector.Descriptor)
            .ToList();

    public bool TryGetSelector(string evidenceType, out IAuditEvidenceSelector? selector)
    {
        if (string.IsNullOrWhiteSpace(evidenceType))
        {
            selector = null;
            return false;
        }

        return _selectorsByType.TryGetValue(evidenceType.Trim(), out selector);
    }
}
