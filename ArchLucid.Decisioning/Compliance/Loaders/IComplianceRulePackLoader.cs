using ArchLucid.Decisioning.Compliance.Models;

namespace ArchLucid.Decisioning.Compliance.Loaders;

public interface IComplianceRulePackLoader
{
    Task<ComplianceRulePack> LoadAsync(CancellationToken ct);
}
