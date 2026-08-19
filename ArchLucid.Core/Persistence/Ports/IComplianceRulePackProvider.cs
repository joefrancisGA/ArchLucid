using ArchLucid.Contracts.Compliance;

namespace ArchLucid.Core.Persistence.Ports;

public interface IComplianceRulePackProvider
{
    Task<ComplianceRulePack> GetRulePackAsync(CancellationToken ct);
}
