using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>Test-only <see cref="IComplianceRulePackProvider" /> returning a fixed pack.</summary>
internal sealed class FixedComplianceRulePackProvider(ComplianceRulePack pack) : IComplianceRulePackProvider
{
    private readonly ComplianceRulePack _pack = pack ?? throw new ArgumentNullException(nameof(pack));

    public Task<ComplianceRulePack> GetRulePackAsync(CancellationToken ct) => Task.FromResult(_pack);
}
