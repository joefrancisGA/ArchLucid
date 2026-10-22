using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecurityCrosswalk;

/// <summary>Enforces non-authoritative AI-proposed crosswalk rules and evaluation eligibility.</summary>
public static class SecurityCrosswalkMappingGuard
{
    public static bool TryValidateWrite(
        SecurityCrosswalkMappingWriteRequest mapping,
        out string? errorMessage)
    {
        ArgumentNullException.ThrowIfNull(mapping);

        if (string.IsNullOrWhiteSpace(mapping.SourceEndpointId) || string.IsNullOrWhiteSpace(mapping.TargetEndpointId))
        {
            errorMessage = "Source and target endpoint ids are required.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(mapping.Version))
        {
            errorMessage = "Crosswalk version is required.";
            return false;
        }

        if (mapping.MappingSource == SecurityCrosswalkMappingSource.AIProposed)
        {
            if (mapping.HumanVerified)
            {
                errorMessage = "AI-proposed crosswalk mappings cannot be human-verified.";
                return false;
            }
        }

        if (mapping.MappingSource == SecurityCrosswalkMappingSource.Authoritative && mapping.HumanVerified == false)
        {
            errorMessage = "Authoritative crosswalk mappings require human verification.";
            return false;
        }

        errorMessage = null;
        return true;
    }

    public static bool IsEligibleForEvaluation(
        SecurityCrosswalkMappingRecord mapping,
        string expectedVersion,
        out string? rejectionReason)
    {
        ArgumentNullException.ThrowIfNull(mapping);

        if (mapping.MappingSource == SecurityCrosswalkMappingSource.AIProposed)
        {
            rejectionReason = "AI-proposed mappings cannot be used as authoritative in evaluation.";
            return false;
        }

        if (!string.Equals(mapping.Version, expectedVersion, StringComparison.OrdinalIgnoreCase))
        {
            rejectionReason = $"Mapping version '{mapping.Version}' does not match expected version '{expectedVersion}'.";
            return false;
        }

        if (mapping.MappingSource == SecurityCrosswalkMappingSource.OrganizationDefined && !mapping.HumanVerified)
        {
            rejectionReason = "Organization-defined mappings require human verification before evaluation use.";
            return false;
        }

        rejectionReason = null;
        return true;
    }
}
