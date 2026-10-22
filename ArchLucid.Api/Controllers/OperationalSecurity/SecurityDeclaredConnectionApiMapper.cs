using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Api.Controllers.OperationalSecurity;

internal static class SecurityDeclaredConnectionApiMapper
{
    public static bool TryMapCreateRequest(
        SecurityDeclaredConnectionCreateApiRequest request,
        out SecurityDeclaredConnectionCreateRequest? mapped,
        out string? errorMessage)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!TryParseRelationshipType(request.RelationshipType, out SecurityDeclaredConnectionRelationshipType relationshipType, out errorMessage))
        {
            mapped = null;
            return false;
        }

        mapped = new SecurityDeclaredConnectionCreateRequest
        {
            FromCloudResourceId = request.FromCloudResourceId,
            ToCloudResourceId = request.ToCloudResourceId,
            RelationshipType = relationshipType,
            Rationale = request.Rationale,
            EvidenceReference = request.EvidenceReference,
            ExpirationUtc = request.ExpirationUtc,
            RequestedByActorKey = request.RequestedByActorKey,
            ApprovedByActorKey = request.ApprovedByActorKey,
        };

        errorMessage = null;
        return true;
    }

    private static bool TryParseRelationshipType(
        string value,
        out SecurityDeclaredConnectionRelationshipType parsed,
        out string? errorMessage)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            parsed = default;
            errorMessage = "RelationshipType is required.";
            return false;
        }

        if (Enum.TryParse(value, ignoreCase: true, out parsed))
        {
            errorMessage = null;
            return true;
        }

        errorMessage = $"Unknown relationship type '{value}'.";
        return false;
    }
}
