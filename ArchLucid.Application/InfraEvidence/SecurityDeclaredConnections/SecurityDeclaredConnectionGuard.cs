using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecurityDeclaredConnections;

public static class SecurityDeclaredConnectionGuard
{
    public static bool TryValidateCreateRequest(
        SecurityDeclaredConnectionCreateRequest request,
        DateTime utcNow,
        out string? errorMessage)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.FromCloudResourceId == Guid.Empty)
        {
            errorMessage = "FromCloudResourceId is required.";
            return false;
        }

        if (request.ToCloudResourceId == Guid.Empty)
        {
            errorMessage = "ToCloudResourceId is required.";
            return false;
        }

        if (request.FromCloudResourceId == request.ToCloudResourceId)
        {
            errorMessage = "From and To cloud resources must differ.";
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

        if (request.Rationale.Trim().Length > SecurityDeclaredConnectionConstants.RationaleMaxLength)
        {
            errorMessage =
                $"Rationale must not exceed {SecurityDeclaredConnectionConstants.RationaleMaxLength} characters.";
            return false;
        }

        if (request.EvidenceReference is { Length: > SecurityDeclaredConnectionConstants.EvidenceReferenceMaxLength })
        {
            errorMessage =
                $"Evidence reference must not exceed {SecurityDeclaredConnectionConstants.EvidenceReferenceMaxLength} characters.";
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

        if (request.RequestedByActorKey.Trim().Length > SecurityDeclaredConnectionConstants.ActorKeyMaxLength
            || request.ApprovedByActorKey.Trim().Length > SecurityDeclaredConnectionConstants.ActorKeyMaxLength)
        {
            errorMessage =
                $"Actor keys must not exceed {SecurityDeclaredConnectionConstants.ActorKeyMaxLength} characters.";
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
        SecurityDeclaredConnectionRenewRequest request,
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

    public static byte[] ComputePayloadHash(SecurityDeclaredConnectionCreateRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var payload = new
        {
            request.FromCloudResourceId,
            request.ToCloudResourceId,
            request.RelationshipType,
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
        SecurityDeclaredConnectionRecord existing,
        DateTime expirationUtc,
        string renewedByActorKey,
        string approvedByActorKey)
    {
        var payload = new
        {
            existing.ConnectionId,
            existing.FromCloudResourceId,
            existing.ToCloudResourceId,
            existing.RelationshipType,
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

    private static bool TryValidateExpiration(DateTime expirationUtc, DateTime utcNow, out string? errorMessage)
    {
        if (expirationUtc <= utcNow)
        {
            errorMessage = "ExpirationUtc must be in the future.";
            return false;
        }

        if (expirationUtc > utcNow.AddDays(SecurityDeclaredConnectionConstants.MaxDurationDays))
        {
            errorMessage =
                $"Connection duration cannot exceed {SecurityDeclaredConnectionConstants.MaxDurationDays} days.";
            return false;
        }

        errorMessage = null;
        return true;
    }
}
