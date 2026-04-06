using ArchLucid.Decisioning.Compliance.Models;

namespace ArchLucid.Decisioning.Compliance.Loaders;

public interface IComplianceRulePackProvider
{
    Task<ComplianceRulePack> GetRulePackAsync(CancellationToken ct);
}
