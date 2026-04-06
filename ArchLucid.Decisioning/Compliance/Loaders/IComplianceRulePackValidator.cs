using ArchLucid.Decisioning.Compliance.Models;

namespace ArchLucid.Decisioning.Compliance.Loaders;

public interface IComplianceRulePackValidator
{
    void Validate(ComplianceRulePack rulePack);
}
