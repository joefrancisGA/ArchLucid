namespace ArchLucid.Decisioning.Compliance.Loaders;

/// <summary>Compatibility stub; canonical port is <see cref="ArchLucid.Core.Persistence.Ports.IComplianceRulePackLoader" />.</summary>
public interface IComplianceRulePackLoader : ArchLucid.Core.Persistence.Ports.IComplianceRulePackLoader
{
    new Task<Compliance.Models.ComplianceRulePack> LoadAsync(CancellationToken ct);

    async Task<ArchLucid.Contracts.Compliance.ComplianceRulePack> ArchLucid.Core.Persistence.Ports.IComplianceRulePackLoader.LoadAsync(CancellationToken ct)
    {
        Compliance.Models.ComplianceRulePack legacyPack = await LoadAsync(ct);
        return (ArchLucid.Contracts.Compliance.ComplianceRulePack)legacyPack;
    }
}
