using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.AgentSimulation;

/// <summary>
///     Attaches LP-03 Kind B citation provenance so Simulator findings survive
///     <c>AgentArchitectureFindingEmissionGate</c> without weakening the gate.
///     Opaque refs such as <c>pricing-profile</c> are not Kind B; a policy-rule id is.
/// </summary>
public static class FakeScenarioFindingKindBProvenance
{
    public const string KeyVaultSecretsRuleId = "simulator-key-vault-secrets";

    public const string PrivateNetworkingRuleId = "simulator-private-networking";

    public const string ManagedIdentityRuleId = "simulator-managed-identity";

    public const string ManagedServicesCostRuleId = "simulator-managed-services-cost";

    public const string StarterCoherenceRuleId = "simulator-starter-coherence";

    public const string ManagedServiceTopologyRuleId = "simulator-managed-service-topology";

    public static ArchitectureFinding Attach(ArchitectureFinding finding, string policyRuleId)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentException.ThrowIfNullOrWhiteSpace(policyRuleId);

        string trimmedRuleId = policyRuleId.Trim();
        finding.PolicyRuleId = trimmedRuleId;

        string policyRef = $"policy-rule:{trimmedRuleId}";
        List<string> evidenceRefs = finding.EvidenceRefs?.ToList() ?? [];

        if (!evidenceRefs.Contains(policyRef, StringComparer.OrdinalIgnoreCase))
        {
            evidenceRefs.Add(policyRef);
        }

        finding.EvidenceRefs = evidenceRefs;

        return finding;
    }
}
