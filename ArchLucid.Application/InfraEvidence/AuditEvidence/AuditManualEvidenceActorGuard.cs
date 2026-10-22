using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

/// <summary>Manual audit evidence may only be submitted by human principals — not agent or LLM actors.</summary>
public static class AuditManualEvidenceActorGuard
{
    private static readonly string[] BlockedActorPrefixes =
    [
        "agent:",
        "llm:",
        "system:agent",
    ];

    public static void EnsureHumanSubmitter(string actorId, ProvenanceKind provenanceKind)
    {
        if (string.IsNullOrWhiteSpace(actorId))
            throw new InvalidOperationException("Manual audit evidence requires a human submitter identity.");

        if (provenanceKind != ProvenanceKind.HumanAssertion)
        {
            throw new InvalidOperationException(
                "Manual audit evidence must use HumanAssertion provenance; models cannot mint organizational documents.");
        }

        foreach (string prefix in BlockedActorPrefixes)
        {
            if (actorId.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Agent and LLM actors cannot submit manual audit evidence.");
            }
        }
    }
}
