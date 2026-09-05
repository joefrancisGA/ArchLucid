using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;

public static class OperationalSecurityFindingGuard
{
    public static bool TryValidateIngestItem(
        OperationalSecurityFindingIngestItem item,
        out string? errorMessage)
    {
        ArgumentNullException.ThrowIfNull(item);

        if (string.IsNullOrWhiteSpace(item.SourceSystem))
        {
            errorMessage = "SourceSystem is required.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(item.SourceFindingId))
        {
            errorMessage = "SourceFindingId is required.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(item.Title))
        {
            errorMessage = "Title is required.";
            return false;
        }

        if (item.Provider == CloudProvider.None)
        {
            errorMessage = "Provider must identify a cloud platform.";
            return false;
        }

        if (item.Metadata.Count > 50)
        {
            errorMessage = "Metadata may not exceed 50 keys per finding.";
            return false;
        }

        foreach (KeyValuePair<string, string?> entry in item.Metadata)
        {
            if (string.IsNullOrWhiteSpace(entry.Key))
            {
                errorMessage = "Metadata keys must be non-empty.";
                return false;
            }

            if (entry.Key.Length > 128)
            {
                errorMessage = "Metadata keys may not exceed 128 characters.";
                return false;
            }

            if (entry.Value is { Length: > 1024 })
            {
                errorMessage = "Metadata values may not exceed 1024 characters.";
                return false;
            }
        }

        errorMessage = null;
        return true;
    }

    public static byte[] ComputePayloadHash(OperationalSecurityFindingIngestItem item)
    {
        ArgumentNullException.ThrowIfNull(item);

        var payload = new
        {
            item.Provider,
            SourceSystem = item.SourceSystem.Trim(),
            SourceFindingId = item.SourceFindingId.Trim(),
            item.CloudResourceId,
            ExternalResourceId = item.ExternalResourceId?.Trim(),
            ResourceType = item.ResourceType?.Trim(),
            SubscriptionOrAccountId = item.SubscriptionOrAccountId?.Trim(),
            ControlId = item.ControlId?.Trim(),
            ControlFramework = item.ControlFramework?.Trim(),
            Title = item.Title.Trim(),
            Description = item.Description?.Trim(),
            Severity = item.Severity?.Trim(),
            item.RiskScore,
            Exploitability = item.Exploitability?.Trim(),
            Exposure = item.Exposure?.Trim(),
            BusinessCriticality = item.BusinessCriticality?.Trim(),
            BlastRadius = item.BlastRadius?.Trim(),
            Status = item.Status,
            RawEvidenceReference = item.RawEvidenceReference?.Trim(),
            item.AssessmentId,
            item.InventoryDiffId,
            item.AuditEvidenceSnapshotId,
            Metadata = item.Metadata
                .OrderBy(pair => pair.Key, StringComparer.Ordinal)
                .ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.Ordinal),
        };

        string json = JsonSerializer.Serialize(payload);
        return SHA256.HashData(Encoding.UTF8.GetBytes(json));
    }

    public static bool PayloadHashesEqual(byte[] left, byte[] right) =>
        left.Length == right.Length && CryptographicOperations.FixedTimeEquals(left, right);
}
