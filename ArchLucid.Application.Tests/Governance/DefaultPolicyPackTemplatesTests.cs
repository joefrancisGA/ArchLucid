using System.Text.Json;

using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Tests.Governance;

public sealed class DefaultPolicyPackTemplatesTests
{
    [Fact]
    public void Azure_well_architected_template_deserializes_to_policy_pack_document()
    {
        PolicyPackContentDocument? doc =
            JsonSerializer.Deserialize<PolicyPackContentDocument>(DefaultPolicyPackTemplates.AzureWellArchitectedAnalogueJson);

        Assert.NotNull(doc);
        Assert.Equal(8, doc.ComplianceRuleKeys.Count);
        Assert.Contains("saas-ctrl-008", doc.ComplianceRuleKeys, StringComparer.Ordinal);
        Assert.True(doc.Metadata.Count >= 1);
    }

    [Fact]
    public void Security_baseline_template_deserializes_to_policy_pack_document()
    {
        PolicyPackContentDocument? doc =
            JsonSerializer.Deserialize<PolicyPackContentDocument>(DefaultPolicyPackTemplates.SecurityBaselineSaaSJson);

        Assert.NotNull(doc);
        Assert.Equal(5, doc.ComplianceRuleKeys.Count);
    }
}
