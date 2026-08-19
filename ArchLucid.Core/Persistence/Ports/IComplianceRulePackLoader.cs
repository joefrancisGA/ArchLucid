using ArchLucid.Contracts.Compliance;

namespace ArchLucid.Core.Persistence.Ports;

public interface IComplianceRulePackLoader
{
    Task<ComplianceRulePack> LoadAsync(CancellationToken ct);
}
