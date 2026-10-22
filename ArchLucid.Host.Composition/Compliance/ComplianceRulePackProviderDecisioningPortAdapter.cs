using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;

namespace ArchLucid.Host.Composition.Compliance;

/// <summary>
///     Forwards <see cref="IComplianceRulePackProvider" /> to the Core persistence port implemented in Persistence.
/// </summary>
internal sealed class ComplianceRulePackProviderDecisioningPortAdapter(
    ArchLucid.Core.Persistence.Ports.IComplianceRulePackProvider inner) : IComplianceRulePackProvider
{
    private readonly ArchLucid.Core.Persistence.Ports.IComplianceRulePackProvider _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    public async Task<ComplianceRulePack> GetRulePackAsync(CancellationToken ct)
    {
        ArchLucid.Contracts.Compliance.ComplianceRulePack pack = await _inner.GetRulePackAsync(ct);

        return (ComplianceRulePack)pack;
    }
}
