using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationPatterns;

/// <summary>Factory guard stub: only Approved pattern versions may be used by remediation factory (IE-11/IE-13).</summary>
public static class RemediationPatternFactoryGuard
{
    public static bool TryValidateForFactoryUse(
        RemediationPatternVersionRecord? version,
        out string? rejectionReason)
    {
        if (version is null)
        {
            rejectionReason = "Remediation pattern version was not found.";
            return false;
        }

        if (version.Status != RemediationPatternStatus.Approved)
        {
            rejectionReason = $"Pattern version '{version.Version}' is {version.Status}; only Approved versions may be used.";
            return false;
        }

        rejectionReason = null;
        return true;
    }
}
