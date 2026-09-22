using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecurityAssetAssertions;

public static class SecurityAssetAssertionGuard
{
    public static bool TryValidateCreateRequest(
        SecurityAssetAssertionCreateRequest request,
        DateTime utcNow,
        out string? errorMessage)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.CloudResourceId == Guid.Empty)
        {
            errorMessage = "CloudResourceId is required.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(request.Rationale))
        {
            errorMessage = "Rationale is required.";
            return false;
        }

        if (request.Rationale.Trim().Length < FindingDispositionValidation.MinimumRationaleLength)
        {
            errorMessage =
                $"Rationale must be at least {FindingDispositionValidation.MinimumRationaleLength} characters.";
            return false;
        }

        if (request.Rationale.Trim().Length > FindingDispositionValidation.MaximumRationaleLength)
        {
            errorMessage =
                $"Rationale must not exceed {FindingDispositionValidation.MaximumRationaleLength} characters.";
            return false;
        }

        if (request.EvidenceReference is { Length: > SecurityAssetAssertionConstants.EvidenceReferenceMaxLength })
        {
            errorMessage =
                $"Evidence reference must not exceed {SecurityAssetAssertionConstants.EvidenceReferenceMaxLength} characters.";
            return false;
        }

        if (!TryValidateExpiration(request.ExpirationUtc, utcNow, out errorMessage))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(request.RequestedByActorKey))
        {
            errorMessage = "RequestedByActorKey is required.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(request.ApprovedByActorKey))
        {
            errorMessage = "ApprovedByActorKey is required.";
            return false;
        }

        if (request.RequestedByActorKey.Trim().Length > SecurityAssetAssertionConstants.ActorKeyMaxLength
            || request.ApprovedByActorKey.Trim().Length > SecurityAssetAssertionConstants.ActorKeyMaxLength)
        {
            errorMessage =
                $"Actor keys must not exceed {SecurityAssetAssertionConstants.ActorKeyMaxLength} characters.";
            return false;
        }

        if (string.Equals(
                request.RequestedByActorKey.Trim(),
                request.ApprovedByActorKey.Trim(),
                StringComparison.OrdinalIgnoreCase))
        {
            errorMessage = "Approver cannot be the same actor as the requester.";
            return false;
        }

        errorMessage = null;
        return true;
    }

    public static bool TryValidateRenewRequest(
        SecurityAssetAssertionRenewRequest request,
        DateTime utcNow,
        out string? errorMessage)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!TryValidateExpiration(request.ExpirationUtc, utcNow, out errorMessage))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(request.RenewedByActorKey))
        {
            errorMessage = "RenewedByActorKey is required.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(request.ApprovedByActorKey))
        {
            errorMessage = "ApprovedByActorKey is required.";
            return false;
        }

        if (string.Equals(
                request.RenewedByActorKey.Trim(),
                request.ApprovedByActorKey.Trim(),
                StringComparison.OrdinalIgnoreCase))
        {
            errorMessage = "Approver cannot be the same actor as the requester.";
            return false;
        }

        errorMessage = null;
        return true;
    }

    public static byte[] ComputePayloadHash(SecurityAssetAssertionCreateRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var payload = new
        {
            request.CloudResourceId,
            request.DataSensitivity,
            request.RegulatoryClass,
            request.DeploymentEnvironment,
            request.BusinessCriticality,
            request.IsRevenueImpact,
            request.IsPatientImpact,
            Rationale = request.Rationale.Trim(),
            EvidenceReference = request.EvidenceReference?.Trim(),
            request.ExpirationUtc,
            RequestedByActorKey = request.RequestedByActorKey.Trim(),
            ApprovedByActorKey = request.ApprovedByActorKey.Trim(),
            ProvenanceKind = ProvenanceKind.HumanAssertion,
        };

        string json = JsonSerializer.Serialize(payload);
        return SHA256.HashData(Encoding.UTF8.GetBytes(json));
    }

    public static byte[] ComputeRenewalPayloadHash(
        SecurityAssetAssertionRecord existing,
        DateTime expirationUtc,
        string renewedByActorKey,
        string approvedByActorKey)
    {
        var payload = new
        {
            existing.AssertionId,
            existing.CloudResourceId,
            existing.DataSensitivity,
            existing.RegulatoryClass,
            existing.DeploymentEnvironment,
            existing.BusinessCriticality,
            existing.IsRevenueImpact,
            existing.IsPatientImpact,
            Rationale = existing.Rationale,
            existing.EvidenceReference,
            ExpirationUtc = expirationUtc,
            RenewedByActorKey = renewedByActorKey.Trim(),
            ApprovedByActorKey = approvedByActorKey.Trim(),
            ProvenanceKind = ProvenanceKind.HumanAssertion,
        };

        string json = JsonSerializer.Serialize(payload);
        return SHA256.HashData(Encoding.UTF8.GetBytes(json));
    }

    public static byte[] ComputeExpiryObservationHash(Guid assertionId, Guid findingId) =>
        SHA256.HashData(Encoding.UTF8.GetBytes($"{assertionId:N}:{findingId:N}:asset-assertion-expiry"));

    private static bool TryValidateExpiration(DateTime expirationUtc, DateTime utcNow, out string? errorMessage)
    {
        if (expirationUtc <= utcNow)
        {
            errorMessage = "ExpirationUtc must be in the future.";
            return false;
        }

        if (expirationUtc > utcNow.AddDays(SecurityAssetAssertionConstants.MaxDurationDays))
        {
            errorMessage =
                $"Assertion duration cannot exceed {SecurityAssetAssertionConstants.MaxDurationDays} days.";
            return false;
        }

        errorMessage = null;
        return true;
    }
}
