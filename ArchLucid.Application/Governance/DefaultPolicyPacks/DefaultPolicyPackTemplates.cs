namespace ArchLucid.Application.Governance.DefaultPolicyPacks;

/// <summary>
///     Canonical JSON bodies for policy pack <c>initialContentJson</c> (same shape as
///     <c>ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackContentDocument</c>) that pilots can paste into
///     <c>POST /v1/policy-packs</c> after tailoring metadata. Includes Azure WAF analogue, SaaS security baseline, AI
///     governance starter (<see cref="AiGovernanceResponsibleAiV1Json" />), and cloud security baseline (
///     <see cref="SecurityArchitectureBaselineV1Json" />). Tenant provisioning seeds platform defaults via
///     <c>IDefaultPolicyPackSeeder</c> — not a silent SQL migration for existing tenants; see <c>docs/library/GOVERNANCE.md</c>
///     and change management for catalog updates.
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

    /// <summary>
    ///     Curated AI governance starter referencing stable keys <c>ai-gov-001</c>–<c>ai-gov-020</c>; full narrative lives in
    ///     <c>docs/samples/policy-packs/ai-governance-responsible-ai-rules-v1.json</c>. Keys must exist in compliance catalog
    ///     before enforcement surfaces resolve findings — see P29-4 seeding.
    /// </summary>
    public const string AiGovernanceResponsibleAiV1Json =
        """
        {
          "complianceRuleIds": [],
          "complianceRuleKeys": [
            "ai-gov-001",
            "ai-gov-002",
            "ai-gov-003",
            "ai-gov-004",
            "ai-gov-005",
            "ai-gov-006",
            "ai-gov-007",
            "ai-gov-008",
            "ai-gov-009",
            "ai-gov-010",
            "ai-gov-011",
            "ai-gov-012",
            "ai-gov-013",
            "ai-gov-014",
            "ai-gov-015",
            "ai-gov-016",
            "ai-gov-017",
            "ai-gov-018",
            "ai-gov-019",
            "ai-gov-020"
          ],
          "alertRuleIds": [],
          "compositeAlertRuleIds": [],
          "advisoryDefaults": {
            "severityFloor": "warning",
            "scanDepth": "standard"
          },
          "metadata": {
            "templateId": "ai-governance-responsible-ai-v1",
            "pack.displayName": "AI Governance / Responsible AI",
            "pack.category": "AI Governance",
            "pack.version": "1.0.0",
            "pack.isDefault": "true",
            "pack.description": "Starter baseline for AI/ML asset governance — model inventory, data handling, human oversight, and risk classification. Maps to NIST AI RMF v1.0 themes and EU AI Act high-risk categories. Not a compliance certification.",
            "frameworkMappingDisclaimer": "Framework references are thematic mapping for reviewers only; they do not constitute certification, attestation, or legal advice.",
            "nistAiRmfVersion": "1.0",
            "euAiActMappingNote": "Category strings mirror Annex III high-risk use-case themes for traceability; final legal classification is organizational counsel responsibility.",
            "curatedRulesArtifact": "docs/samples/policy-packs/ai-governance-responsible-ai-rules-v1.json",
            "goldenManifest.governance.fields": "ComplianceTags, PolicyConstraints, RequiredControls, RiskClassification",
            "goldenManifest.metadata.fields": "ManifestVersion, ParentManifestVersion, ChangeDescription, DecisionTraceIds, CreatedUtc",
            "goldenManifest.service.fields": "ServiceId, ServiceName, ServiceType, RuntimePlatform, Purpose, Tags, RequiredControls"
          }
        }
        """;

    /// <summary>
    ///     Security architecture baseline referencing <c>sec-base-001</c>–<c>sec-base-030</c>; curated narrative in
    ///     <c>docs/samples/policy-packs/security-architecture-baseline-rules-v1.json</c>. Keys require compliance catalog
    ///     registration before enforcement — see P29-4 seeding.
    /// </summary>
    public const string SecurityArchitectureBaselineV1Json =
        """
        {
          "complianceRuleIds": [],
          "complianceRuleKeys": [
            "sec-base-001",
            "sec-base-002",
            "sec-base-003",
            "sec-base-004",
            "sec-base-005",
            "sec-base-006",
            "sec-base-007",
            "sec-base-008",
            "sec-base-009",
            "sec-base-010",
            "sec-base-011",
            "sec-base-012",
            "sec-base-013",
            "sec-base-014",
            "sec-base-015",
            "sec-base-016",
            "sec-base-017",
            "sec-base-018",
            "sec-base-019",
            "sec-base-020",
            "sec-base-021",
            "sec-base-022",
            "sec-base-023",
            "sec-base-024",
            "sec-base-025",
            "sec-base-026",
            "sec-base-027",
            "sec-base-028",
            "sec-base-029",
            "sec-base-030"
          ],
          "alertRuleIds": [],
          "compositeAlertRuleIds": [],
          "advisoryDefaults": {
            "severityFloor": "warning",
            "scanDepth": "standard"
          },
          "metadata": {
            "templateId": "security-architecture-baseline-v1",
            "pack.displayName": "Security Architecture Baseline",
            "pack.category": "Security",
            "pack.version": "1.1.0",
            "pack.isDefault": "true",
            "pack.description": "Starter security posture checks for cloud architecture reviews — identity, network, encryption, logging, and secure SDLC. Aligned to CIS Azure Foundations and OWASP ASVS themes. Not an exhaustive compliance assessment.",
            "frameworkMappingDisclaimer": "CIS and OWASP references are thematic alignment for architecture review only; they are not an attestation against those frameworks.",
            "curatedRulesArtifact": "docs/samples/policy-packs/security-architecture-baseline-rules-v1.json",
            "azureExtractor.normalizedManifest.fields": "SchemaVersion, ScriptVersion, CollectionTimestamp, SubscriptionId, ScopeDescriptor, SwitchesUsed, AzModuleVersion",
            "goldenManifest.datastore.fields": "DatastoreId, DatastoreName, DatastoreType, RuntimePlatform, PrivateEndpointRequired, EncryptionAtRestRequired",
            "goldenManifest.governance.fields": "ComplianceTags, PolicyConstraints, RequiredControls, RiskClassification",
            "goldenManifest.service.fields": "ServiceId, ServiceName, RuntimePlatform, Tags, RequiredControls",
            "goldenManifest.relationships": "relationshipType AuthenticatesWith, ReadsFrom, WritesTo"
          }
        }
        """;
}
