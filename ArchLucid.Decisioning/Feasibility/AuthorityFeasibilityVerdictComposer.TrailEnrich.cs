using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Feasibility;

public sealed partial class AuthorityFeasibilityVerdictComposer
{
    private static readonly JsonSerializerOptions TrailCloneOptions = new(JsonSerializerDefaults.Web);

    private static void EnrichTrailFromManifest(ManifestDocument manifest, TransparencyTrail trail)
    {
        foreach (PolicyControlItem violation in manifest.Policy.Violations)
        {
            string key = string.IsNullOrWhiteSpace(violation.ControlId)
                ? $"policy.violation.{violation.ControlName}"
                : $"policy.violation.{violation.ControlId}";

            UpsertInferred(trail, key, violation.ControlName, 85);
        }

        foreach (ManifestIssue issue in manifest.UnresolvedIssues.Items)
            UpsertInferred(trail, $"manifest.issue.{issue.IssueType}", issue.Title, 70);

        foreach (RequirementCoverageItem uncovered in manifest.Requirements.Uncovered.Where(static item => item.IsMandatory))
            UpsertInferred(trail, $"requirement.uncovered.{uncovered.RequirementName}", uncovered.RequirementText, 75);
    }

    private static void UpsertInferred(TransparencyTrail trail, string key, string value, int confidence)
    {
        if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(value))
            return;

        InferredTrailEntry? existing = trail.Inferred.Find(entry =>
            string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase));

        if (existing is not null)
        {
            existing.Value = value.Trim();
            existing.Confidence = confidence;
            return;
        }

        trail.Inferred.Add(
            new InferredTrailEntry
            {
                Key = key.Trim(),
                Value = value.Trim(),
                Confidence = confidence,
            });
    }

    private static TransparencyTrail? CloneTrail(TransparencyTrail? source)
    {
        if (source is null)
            return null;

        string json = JsonSerializer.Serialize(source, TrailCloneOptions);
        return JsonSerializer.Deserialize<TransparencyTrail>(json, TrailCloneOptions);
    }
}
