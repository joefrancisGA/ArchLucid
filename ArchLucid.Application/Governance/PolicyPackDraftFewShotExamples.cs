namespace ArchLucid.Application.Governance;

/// <summary>Curated rule few-shot excerpts for policy-pack drafting prompts.</summary>
internal static class PolicyPackDraftFewShotExamples
{
    internal static string BuildFewShotJson()
    {
        return """
               [
                 {
                   "id": "waf-az-001",
                   "title": "Reliability — regional and zone redundancy documented",
                   "description": "When resources.json lists workloads across multiple Azure regions or availability zones, the architecture narrative must explain failover, RTO/RPO, and traffic routing assumptions.",
                   "severity": "High",
                   "remediationGuidance": "Document active/active vs active/passive stance in governance.RequiredControls.",
                   "evidenceHints": ["governance.RequiredControls", "metadata.ChangeDescription"],
                   "frameworkMappings": [{ "framework": "Microsoft Azure Well-Architected", "requirement": "Reliability — redundancy" }],
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
