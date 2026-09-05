using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.OperationalSecurityExceptions;

public static class OperationalSecurityExceptionGuard
{
    public const int MaxDurationDays = 365;

    public const int OwnerActorKeyMaxLength = 256;

    public const int EvidenceReferenceMaxLength = 1024;

    public const int ResidualRiskMaxLength = 2000;

    public const int CompensatingControlsMaxLength = 4000;

    public static bool TryValidateCreateRequest(
        OperationalSecurityExceptionCreateRequest request,
        DateTime utcNow,
        out string? errorMessage)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!HasAtLeastOneTarget(request))
        {
            errorMessage = "At least one of FindingId, PatternId, or CloudResourceId is required.";
            return false;
        }

        if (request.OwnerActorKeys.Count == 0
            || request.OwnerActorKeys.Any(string.IsNullOrWhiteSpace))
        {
            errorMessage = "At least one non-empty owner actor key is required.";
            return false;
        }

        foreach (string owner in request.OwnerActorKeys)
        {
            if (owner.Trim().Length > OwnerActorKeyMaxLength)
            {
                errorMessage = $"Owner actor keys must not exceed {OwnerActorKeyMaxLength} characters.";
                return false;
            }
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

        if (request.ResidualRisk is { Length: > ResidualRiskMaxLength })
        {
            errorMessage = $"Residual risk must not exceed {ResidualRiskMaxLength} characters.";
            return false;
        }

        if (request.CompensatingControls is { Length: > CompensatingControlsMaxLength })
        {
            errorMessage = $"Compensating controls must not exceed {CompensatingControlsMaxLength} characters.";
            return false;
        }

        if (request.EvidenceReference is { Length: > EvidenceReferenceMaxLength })
        {
            errorMessage = $"Evidence reference must not exceed {EvidenceReferenceMaxLength} characters.";
            return false;
        }

        if (request.ExpirationUtc <= utcNow)
        {
            errorMessage = "ExpirationUtc must be in the future.";
            return false;
        }

        if (request.ExpirationUtc > utcNow.AddDays(MaxDurationDays))
        {
            errorMessage = $"Exception duration cannot exceed {MaxDurationDays} days.";
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

    public static byte[] ComputePayloadHash(OperationalSecurityExceptionCreateRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var payload = new
        {
            request.FindingId,
            request.PatternId,
            request.CloudResourceId,
            OwnerActorKeys = request.OwnerActorKeys
                .Select(key => key.Trim())
                .OrderBy(key => key, StringComparer.Ordinal)
                .ToArray(),
            Rationale = request.Rationale.Trim(),
            ResidualRisk = request.ResidualRisk?.Trim(),
            CompensatingControls = request.CompensatingControls?.Trim(),
            EvidenceReference = request.EvidenceReference?.Trim(),
            request.ExpirationUtc,
            RequestedByActorKey = request.RequestedByActorKey.Trim(),
            ApprovedByActorKey = request.ApprovedByActorKey.Trim(),
        };

        string json = JsonSerializer.Serialize(payload);
        return SHA256.HashData(Encoding.UTF8.GetBytes(json));
    }

    public static byte[] ComputeExpiryObservationHash(Guid exceptionId, Guid? findingId) =>
        SHA256.HashData(Encoding.UTF8.GetBytes($"{exceptionId:N}:{findingId:N}:expiry"));

    private static bool HasAtLeastOneTarget(OperationalSecurityExceptionCreateRequest request) =>
        request.FindingId is { } findingId && findingId != Guid.Empty
        || request.PatternId is { } patternId && patternId != Guid.Empty
        || request.CloudResourceId is { } cloudResourceId && cloudResourceId != Guid.Empty;
}
