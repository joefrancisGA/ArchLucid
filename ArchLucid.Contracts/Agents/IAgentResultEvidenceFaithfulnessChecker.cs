namespace ArchLucid.Contracts.Agents;

/// <summary>Deterministic AgentResult→evidence grounding (no LLM).</summary>
public interface IAgentResultEvidenceFaithfulnessChecker
{
    AgentResultEvidenceFaithfulnessReport Evaluate(string parsedResultJson, AgentEvidencePackage evidencePackage);
}
