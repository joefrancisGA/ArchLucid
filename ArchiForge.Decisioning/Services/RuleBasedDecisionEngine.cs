using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ArchiForge.Decisioning.Findings.Factories;
using ArchiForge.Decisioning.Interfaces;
using ArchiForge.Decisioning.Models;
using ArchiForge.KnowledgeGraph.Models;

namespace ArchiForge.Decisioning.Services;

public class RuleBasedDecisionEngine : IDecisionEngine
{
    private readonly IDecisionRuleProvider _ruleProvider;
    private readonly IGoldenManifestRepository _manifestRepository;
    private readonly IDecisionTraceRepository _traceRepository;

    public RuleBasedDecisionEngine(
        IDecisionRuleProvider ruleProvider,
        IGoldenManifestRepository manifestRepository,
        IDecisionTraceRepository traceRepository)
    {
        _ruleProvider = ruleProvider;
        _manifestRepository = manifestRepository;
        _traceRepository = traceRepository;
    }

    public async Task<(GoldenManifest Manifest, DecisionTrace Trace)> DecideAsync(
        Guid runId,
        Guid contextSnapshotId,
        GraphSnapshot graphSnapshot,
        FindingsSnapshot findingsSnapshot,
        CancellationToken ct)
    {
        var rules = (await _ruleProvider.GetRulesAsync(ct))
            .OrderByDescending(r => r.Priority)
            .ToList();

        var trace = new DecisionTrace
        {
            DecisionTraceId = Guid.NewGuid(),
            RunId = runId,
            CreatedUtc = DateTime.UtcNow
        };

        var manifest = new GoldenManifest
        {
            ManifestId = Guid.NewGuid(),
            RunId = runId,
            ContextSnapshotId = contextSnapshotId,
            GraphSnapshotId = graphSnapshot.GraphSnapshotId,
            FindingsSnapshotId = findingsSnapshot.FindingsSnapshotId,
            DecisionTraceId = trace.DecisionTraceId,
            CreatedUtc = DateTime.UtcNow
        };

        foreach (var finding in findingsSnapshot.Findings)
        {
            var matchingRules = rules
                .Where(r => string.Equals(
                    r.AppliesToFindingType,
                    finding.FindingType,
                    StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (matchingRules.Count == 0)
            {
                trace.Notes.Add($"No rule matched finding {finding.FindingId} ({finding.FindingType}).");
                continue;
            }

            foreach (var rule in matchingRules)
            {
                trace.AppliedRuleIds.Add(rule.RuleId);

                switch (rule.Action.ToLowerInvariant())
                {
                    case "require":
                        ApplyRequiredFinding(finding, manifest, trace);
                        break;

                    case "reject":
                        trace.RejectedFindingIds.Add(finding.FindingId);
                        trace.Notes.Add($"Rejected finding {finding.FindingId} by rule {rule.Name}.");
                        break;

                    case "allow":
                        ApplyAllowedFinding(finding, manifest, trace);
                        break;

                    case "prefer":
                        trace.AcceptedFindingIds.Add(finding.FindingId);
                        manifest.Assumptions.Add($"Preferred: {finding.Title}");
                        break;

                    default:
                        trace.Notes.Add($"No recognized action for rule {rule.Name}.");
                        break;
                }
            }
        }

        manifest.ManifestHash = ComputeManifestHash(manifest);

        await _traceRepository.SaveAsync(trace, ct);
        await _manifestRepository.SaveAsync(manifest, ct);

        return (manifest, trace);
    }

    private static void ApplyRequiredFinding(
        Finding finding,
        GoldenManifest manifest,
        DecisionTrace trace)
    {
        trace.AcceptedFindingIds.Add(finding.FindingId);

        if (finding.FindingType.Equals("RequirementFinding", StringComparison.OrdinalIgnoreCase))
        {
            var payload = FindingPayloadConverter.ToRequirementPayload(finding);

            manifest.Decisions.Add(new ResolvedArchitectureDecision
            {
                Category = "Requirement",
                Title = payload?.RequirementName ?? finding.Title,
                SelectedOption = "Accepted",
                Rationale = payload?.RequirementText ?? finding.Rationale,
                SupportingFindingIds = new List<string> { finding.FindingId }
            });

            return;
        }

        manifest.Decisions.Add(new ResolvedArchitectureDecision
        {
            Category = finding.Category,
            Title = finding.Title,
            SelectedOption = "Accepted",
            Rationale = finding.Rationale,
            SupportingFindingIds = new List<string> { finding.FindingId }
        });
    }

    private static void ApplyAllowedFinding(
        Finding finding,
        GoldenManifest manifest,
        DecisionTrace trace)
    {
        trace.AcceptedFindingIds.Add(finding.FindingId);

        if (finding.FindingType.Equals("TopologyGap", StringComparison.OrdinalIgnoreCase))
        {
            var payload = FindingPayloadConverter.ToTopologyGapPayload(finding);
            manifest.Warnings.Add(payload?.Description ?? finding.Title);
            return;
        }

        manifest.Warnings.Add(finding.Title);
    }

    private static string ComputeManifestHash(GoldenManifest manifest)
    {
        var canonical = JsonSerializer.Serialize(new
        {
            manifest.ManifestId,
            manifest.RunId,
            manifest.ContextSnapshotId,
            manifest.GraphSnapshotId,
            manifest.FindingsSnapshotId,
            manifest.DecisionTraceId,
            Decisions = manifest.Decisions
                .OrderBy(d => d.DecisionId)
                .Select(d => new
                {
                    d.DecisionId,
                    d.Category,
                    d.Title,
                    d.SelectedOption,
                    d.Rationale,
                    SupportingFindingIds = d.SupportingFindingIds.OrderBy(x => x).ToArray()
                })
                .ToArray(),
            Assumptions = manifest.Assumptions.OrderBy(x => x).ToArray(),
            Warnings = manifest.Warnings.OrderBy(x => x).ToArray()
        });

        using var sha = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(canonical);
        var hash = sha.ComputeHash(bytes);
        return Convert.ToHexString(hash);
    }
}

