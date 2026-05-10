namespace ArchLucid.Application.Governance.DefaultPolicyPacks;

/// <summary>
///     Canonical JSON bodies for policy pack <c>initialContentJson</c> (same shape as
///     <c>ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackContentDocument</c>) that pilots can paste into
///     <c>POST /v1/governance/policy-packs</c> after tailoring metadata. Not auto-seeded into SQL — avoids surprise tenant
///     mutations; see <c>docs/library/GOVERNANCE.md</c>.
/// </summary>
public static class DefaultPolicyPackTemplates
{
    /// <summary>Maps SaaS control catalog keys to WAF themes (disclaimer embedded in metadata).</summary>
    public const string AzureWellArchitectedAnalogueJson =
        """
        {
          "complianceRuleIds": [],
          "complianceRuleKeys": [
            "saas-ctrl-001",
            "saas-ctrl-002",
            "saas-ctrl-003",
            "saas-ctrl-004",
            "saas-ctrl-005",
            "saas-ctrl-006",
            "saas-ctrl-007",
            "saas-ctrl-008"
          ],
          "alertRuleIds": [],
          "compositeAlertRuleIds": [],
          "advisoryDefaults": {
            "severityFloor": "warning"
          },
          "metadata": {
            "templateId": "azure-waf-aligned-starter-v1",
            "wafAnalogueDisclaimer": "Not an official Microsoft Well-Architected submission; illustrative mapping for pilots.",
            "pillarSummary": "Reliability DR plus security/compliance/ops controls from saas-ctrl-001 through 008.",
            "sourceVerticalKeys": "templates/policy-packs/saas/"
          }
        }
        """;

    /// <summary>Smaller pack: logging, crypto, access, third-party, segmentation only.</summary>
    public const string SecurityBaselineSaaSJson =
        """
        {
          "complianceRuleIds": [],
          "complianceRuleKeys": [
            "saas-ctrl-001",
            "saas-ctrl-002",
            "saas-ctrl-003",
            "saas-ctrl-004",
            "saas-ctrl-005"
          ],
          "alertRuleIds": [],
          "compositeAlertRuleIds": [],
          "advisoryDefaults": {
            "severityFloor": "warning"
          },
          "metadata": {
            "templateId": "security-baseline-saas-v1",
            "summary": "Logging, encryption, access, vendors, segmentation — extend when org rules exist."
          }
        }
        """;
}
