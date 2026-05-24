namespace ArchLucid.Decisioning.Compliance.Loaders;

/// <summary>Compatibility stub; canonical port is <see cref="ArchLucid.Core.Persistence.Ports.IComplianceRulePackProvider" />.</summary>
public interface IComplianceRulePackProvider : ArchLucid.Core.Persistence.Ports.IComplianceRulePackProvider
{
    new Task<Compliance.Models.ComplianceRulePack> GetRulePackAsync(CancellationToken ct);

    async Task<ArchLucid.Contracts.Compliance.ComplianceRulePack> ArchLucid.Core.Persistence.Ports.IComplianceRulePackProvider.GetRulePackAsync(CancellationToken ct)
    {
        Compliance.Models.ComplianceRulePack legacyPack = await GetRulePackAsync(ct);
        return (ArchLucid.Contracts.Compliance.ComplianceRulePack)legacyPack;
    }
}
