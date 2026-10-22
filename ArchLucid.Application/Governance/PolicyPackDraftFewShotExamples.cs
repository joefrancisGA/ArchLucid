namespace ArchLucid.Application.Governance;

/// <summary>Curated rule few-shot excerpts for policy-pack drafting prompts.</summary>
internal static class PolicyPackDraftFewShotExamples
{
    internal static string BuildFewShotJson()
    {
        return """
               [
                 {
                   "id": "rel-base-002",
                   "title": "Availability and recovery objectives defined by workload tier",
                   "description": "Tiered workloads should state availability targets plus RTO/RPO (or an explicit decision that recovery objectives are not required for this lifecycle stage).",
                   "severity": "High",
                   "remediationGuidance": "Capture RTO/RPO or availability targets per workload tier in governance.PolicyConstraints.",
                   "evidenceHints": ["governance.PolicyConstraints", "metadata.ChangeDescription"],
                   "frameworkMappings": [{ "framework": "ArchLucid Architecture Quality Baseline", "requirement": "Reliability — recovery objectives" }],
                   "priority": "P0"
                 },
                 {
                   "id": "encrypt-phi-001",
                   "title": "Encrypt regulated data at rest",
                   "description": "Datastores holding regulated data must declare encryption at rest and key custody.",
                   "severity": "Critical",
                   "remediationGuidance": "Add required control on datastores and cite key vault references.",
                   "evidenceHints": ["datastores[].EncryptionAtRest", "governance.RequiredControls"],
                   "frameworkMappings": [{ "framework": "HIPAA", "requirement": "164.312(a)(2)(iv)" }],
                   "priority": "P0"
                 }
               ]
               """;
    }

    internal static string BuildSchemaDescription()
    {
        return """
               {
                 "id": "string (kebab-case rule id)",
                 "title": "string",
                 "description": "string",
                 "severity": "Critical|High|Medium|Low",
                 "remediationGuidance": "string",
                 "evidenceHints": ["string manifest or extractor paths"],
                 "frameworkMappings": [{ "framework": "string", "requirement": "string", "control": "optional string" }],
                 "priority": "P0|P1|P2"
               }
               """;
    }
}
