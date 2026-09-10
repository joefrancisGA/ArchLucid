using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Core.InfraEvidence;

public static class SecurityEvidencePathRoutingGuard
{
    public static void EnsureAllowedProvenance(ProvenanceKind provenanceKind)
    {
        if (provenanceKind is not ProvenanceKind.DerivedFact and not ProvenanceKind.HumanAssertion)
        {
            throw new InvalidOperationException(
                $"Security evidence path routing only allows DerivedFact or HumanAssertion provenance, not {provenanceKind}.");
        }
    }

    public static void EnsureSeparationOfDuties(IReadOnlyList<SecurityEvidencePathRoutingRecord> routingRows)
    {
        ArgumentNullException.ThrowIfNull(routingRows);

        string? remediator = NormalizePrincipal(FindPrincipal(routingRows, SecurityEvidencePathRoutingRole.Remediator));
        string? verificationOwner = NormalizePrincipal(FindPrincipal(routingRows, SecurityEvidencePathRoutingRole.VerificationOwner));
        string? requiredApproval = NormalizePrincipal(FindPrincipal(routingRows, SecurityEvidencePathRoutingRole.RequiredApproval));

        if (remediator is not null)
        {
            if (verificationOwner is not null
                && string.Equals(remediator, verificationOwner, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Separation of duties violation: remediator cannot equal verification owner.");
            }

            if (requiredApproval is not null
                && string.Equals(remediator, requiredApproval, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Separation of duties violation: remediator cannot equal required approval.");
            }
        }
    }

    private static string? FindPrincipal(
        IReadOnlyList<SecurityEvidencePathRoutingRecord> routingRows,
        SecurityEvidencePathRoutingRole role) =>
        routingRows
            .FirstOrDefault(row => row.Role == role)
            ?.PrincipalId;

    private static string? NormalizePrincipal(string? principal)
    {
        if (string.IsNullOrWhiteSpace(principal))
        {
            return null;
        }

        return principal.Trim();
    }
}
