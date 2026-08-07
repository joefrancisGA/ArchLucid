using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Cli.Commands;

internal static class CitationIntegrityRulesLoader
{
    private const string DefaultRulesFileName = "citation_integrity_rules.v1.json";

    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static CitationIntegrityRules Load(string? rulesFilePath)
    {
        string path = rulesFilePath ?? ResolveDefaultRulesPath();
        string json = File.ReadAllText(path);
        CitationIntegrityRules? rules = JsonSerializer.Deserialize<CitationIntegrityRules>(json, JsonRead)
            ?? throw new InvalidOperationException($"Citation integrity rules are missing or empty: {path}");

        if (rules.KeyClaimClasses.Count == 0)
            throw new InvalidOperationException($"Citation integrity rules must define keyClaimClasses: {path}");

        return rules;
    }

    private static string ResolveDefaultRulesPath()
    {
        string baseDirectory = AppContext.BaseDirectory;
        string bundled = Path.Combine(baseDirectory, "Data", DefaultRulesFileName);

        if (File.Exists(bundled))
            return bundled;

        string repoRelative = Path.GetFullPath(
            Path.Combine(baseDirectory, "..", "..", "..", "..", "ArchLucid.Cli", "Data", DefaultRulesFileName));

        if (File.Exists(repoRelative))
            return repoRelative;

        throw new FileNotFoundException(
            $"Citation integrity rules not found (expected Data/{DefaultRulesFileName} next to the CLI assembly).",
            bundled);
    }
}

internal sealed class CitationIntegrityRules
{
    public int SchemaVersion { get; init; }

    public List<string> KeyClaimClasses { get; init; } = [];

    public string MinimumFindingSeverity { get; init; } = "Warning";

    public List<string> PolicyClaimKeywords { get; init; } = [];

    public int FailThresholdDefault { get; init; } = 1;

    public int DefaultSampleSize { get; init; } = 5;
}

internal static class CitationIntegrityEvaluator
{
    internal static CitationIntegrityRunResult EvaluateRun(CitationIntegrityRunBundle bundle, CitationIntegrityRules rules)
    {
        ArgumentNullException.ThrowIfNull(bundle);
        ArgumentNullException.ThrowIfNull(rules);

        FindingSeverity minimumSeverity = ParseSeverity(rules.MinimumFindingSeverity);
        List<CitationIntegrityIssue> issues = new();

        foreach (AgentResult result in bundle.AgentResults)
        {
            string agentLabel = result.AgentType.ToString();

            if (!rules.KeyClaimClasses.Contains(agentLabel, StringComparer.OrdinalIgnoreCase))
                continue;

            EvaluateAgentResult(bundle.RunId, result, agentLabel, minimumSeverity, rules, issues);
        }

        CitationIntegrityVerdict verdict = DeriveRunVerdict(issues);

        return new CitationIntegrityRunResult
        {
            RunId = bundle.RunId,
            Verdict = verdict,
            AgentResultCount = bundle.AgentResults.Count,
            Issues = issues
                .OrderBy(static issue => issue.ClaimCategory, StringComparer.Ordinal)
                .ThenBy(static issue => issue.Reason, StringComparer.Ordinal)
                .ToList(),
        };
    }

    private static void EvaluateAgentResult(
        string runId,
        AgentResult result,
        string agentLabel,
        FindingSeverity minimumSeverity,
        CitationIntegrityRules rules,
        List<CitationIntegrityIssue> issues)
    {
        bool hasValidCitation = HasValidCitation(result.Citations);
        bool hasEvidenceRefs = result.EvidenceRefs.Count > 0;

        foreach (ArchitectureFinding finding in result.Findings)
        {
            if (finding.Severity < minimumSeverity)
                continue;

            string category = string.IsNullOrWhiteSpace(finding.Category) ? agentLabel : finding.Category;
            bool findingHasEvidence = finding.EvidenceRefs.Count > 0 || hasEvidenceRefs || hasValidCitation;

            if (!findingHasEvidence)
            {
                issues.Add(BuildIssue(
                    runId,
                    category,
                    agentLabel,
                    finding.FindingId,
                    CitationIntegrityVerdict.Fail,
                    "Missing evidence reference or citation for decision-grade finding.",
                    $"GET /v1/architecture/review/{runId}#finding={finding.FindingId}"));

                continue;
            }

            EvaluateCitationQuality(runId, category, agentLabel, finding.FindingId, result.Citations, issues);
        }

        if (ContainsPolicyClaim(result, rules) && !hasEvidenceRefs && !hasValidCitation)
        {
            issues.Add(BuildIssue(
                runId,
                agentLabel,
                agentLabel,
                result.ResultId,
                CitationIntegrityVerdict.Fail,
                "Policy or ROI claim lacks evidence reference and structured citation.",
                $"GET /v1/architecture/review/{runId}#result={result.ResultId}"));
        }
    }

    private static void EvaluateCitationQuality(
        string runId,
        string category,
        string agentLabel,
        string findingId,
        IEnumerable<Citation>? citations,
        List<CitationIntegrityIssue> issues)
    {
        if (citations is null)
            return;

        foreach (Citation citation in citations)
        {
            if (string.IsNullOrWhiteSpace(citation.SourceId))
            {
                issues.Add(BuildIssue(
                    runId,
                    category,
                    agentLabel,
                    findingId,
                    CitationIntegrityVerdict.Fail,
                    "Citation SourceId is empty.",
                    $"GET /v1/architecture/review/{runId}#finding={findingId}"));

                continue;
            }

            if (string.IsNullOrWhiteSpace(citation.Description))
            {
                issues.Add(BuildIssue(
                    runId,
                    category,
                    agentLabel,
                    findingId,
                    CitationIntegrityVerdict.Warn,
                    "Citation description is empty (weak traceability).",
                    $"GET /v1/architecture/review/{runId}#finding={findingId}"));
            }
        }
    }

    private static bool HasValidCitation(IEnumerable<Citation>? citations)
    {
        if (citations is null)
            return false;

        return citations.Any(static citation => !string.IsNullOrWhiteSpace(citation.SourceId));
    }

    private static bool ContainsPolicyClaim(AgentResult result, CitationIntegrityRules rules)
    {
        foreach (string claim in result.Claims)
        {
            string normalized = claim.ToLowerInvariant();

            foreach (string keyword in rules.PolicyClaimKeywords)
            {
                if (normalized.Contains(keyword, StringComparison.Ordinal))
                    return true;
            }
        }

        return false;
    }

    private static CitationIntegrityIssue BuildIssue(
        string runId,
        string claimCategory,
        string agentType,
        string? findingId,
        CitationIntegrityVerdict verdict,
        string reason,
        string evidencePointer)
    {
        return new CitationIntegrityIssue
        {
            RunId = runId,
            ClaimCategory = claimCategory,
            AgentType = agentType,
            FindingId = findingId,
            Verdict = verdict,
            Reason = reason,
            EvidencePointer = evidencePointer,
        };
    }

    private static CitationIntegrityVerdict DeriveRunVerdict(IReadOnlyList<CitationIntegrityIssue> issues)
    {
        if (issues.Any(static issue => issue.Verdict == CitationIntegrityVerdict.Fail))
            return CitationIntegrityVerdict.Fail;

        if (issues.Any(static issue => issue.Verdict == CitationIntegrityVerdict.Warn))
            return CitationIntegrityVerdict.Warn;

        return CitationIntegrityVerdict.Pass;
    }

    private static FindingSeverity ParseSeverity(string raw)
    {
        if (Enum.TryParse(raw, ignoreCase: true, out FindingSeverity parsed))
            return parsed;

        return FindingSeverity.Warning;
    }
}
