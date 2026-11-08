using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings.FindingVerification;

internal static class FindingVerificationFindingProjection
{
    public static ArchitectureFinding ToArchitectureFinding(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        AgentType sourceAgent = default;
        bool sourceAgentStored = false;

        if (!string.IsNullOrWhiteSpace(finding.EngineType)
            && Enum.TryParse(finding.EngineType, ignoreCase: true, out AgentType parsedAgent))
        {
            sourceAgent = parsedAgent;
            sourceAgentStored = true;
        }

        return new ArchitectureFinding
        {
            FindingId = finding.FindingId,
            SourceAgent = sourceAgent,
            SourceAgentStored = sourceAgentStored,
            Severity = finding.Severity,
            Category = finding.Category ?? string.Empty,
            Message = finding.Title ?? string.Empty,
            ReasoningTrace = finding.Rationale,
            EvidenceRefs = finding.EvidenceRefs?.ToList() ?? [],
            PolicyRuleId = finding.PolicyRuleId,
            EnforcementTier = finding.EnforcementTier,
            Classification = finding.Classification,
        };
    }

    public static IReadOnlyList<ArchitectureFinding> ProjectSnapshotFindings(FindingsSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        List<Finding> findings = snapshot.Findings.ToList();

        foreach (Finding checklistFinding in snapshot.ChecklistCoverage)
        {
            if (findings.Any(existing =>
                    string.Equals(existing.FindingId, checklistFinding.FindingId, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            findings.Add(checklistFinding);
        }

        return findings
            .Select(ToArchitectureFinding)
            .ToList();
    }
}
