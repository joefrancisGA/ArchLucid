using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Api.Controllers.OperationalSecurity;

internal static class SecurityAssetAssertionApiMapper
{
    public static bool TryMapCreateRequest(
        SecurityAssetAssertionCreateApiRequest request,
        out SecurityAssetAssertionCreateRequest? mapped,
        out string? errorMessage)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!TryParseEnum(request.DataSensitivity, out SecurityAssetDataSensitivity dataSensitivity, out errorMessage))
        {
            mapped = null;
            return false;
        }

        if (!TryParseEnum(request.RegulatoryClass, out SecurityAssetRegulatoryClass regulatoryClass, out errorMessage))
        {
            mapped = null;
            return false;
        }

        if (!TryParseEnum(
                request.DeploymentEnvironment,
                out SecurityAssetDeploymentEnvironment deploymentEnvironment,
                out errorMessage))
        {
            mapped = null;
            return false;
        }

        if (!TryParseEnum(
                request.BusinessCriticality,
                out SecurityAssetBusinessCriticality businessCriticality,
                out errorMessage))
        {
            mapped = null;
            return false;
        }

        mapped = new SecurityAssetAssertionCreateRequest
        {
            CloudResourceId = request.CloudResourceId,
            DataSensitivity = dataSensitivity,
            RegulatoryClass = regulatoryClass,
            DeploymentEnvironment = deploymentEnvironment,
            BusinessCriticality = businessCriticality,
            IsRevenueImpact = request.IsRevenueImpact,
            IsPatientImpact = request.IsPatientImpact,
            Rationale = request.Rationale,
            EvidenceReference = request.EvidenceReference,
            ExpirationUtc = request.ExpirationUtc,
            RequestedByActorKey = request.RequestedByActorKey,
            ApprovedByActorKey = request.ApprovedByActorKey,
        };

        errorMessage = null;
        return true;
    }

    private static bool TryParseEnum<TEnum>(
        string value,
        out TEnum parsed,
        out string? errorMessage)
        where TEnum : struct, Enum
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            parsed = default;
            errorMessage = $"{typeof(TEnum).Name} is required.";
            return false;
        }

        if (Enum.TryParse(value, ignoreCase: true, out parsed))
        {
            errorMessage = null;
            return true;
        }

        errorMessage = $"Unknown {typeof(TEnum).Name} value '{value}'.";
        return false;
    }
}
