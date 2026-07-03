using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Retrieval.FineTuning.Models;
using ArchLucid.Retrieval.FineTuning.Redaction;

namespace ArchLucid.Retrieval.FineTuning.Export;

/// <summary>Builds supervised fine-tuning examples from committed manifest decisions and policy summaries.</summary>
public static class AcceptedManifestTrainingExampleBuilder
{
    private const string SystemPrompt =
        "You are an architecture decision assistant. Summarize accepted manifest decisions with rationale.";

    /// <summary>Creates one training record per manifest with non-empty decision content.</summary>
    public static IReadOnlyList<FineTuningTrainingRecord> BuildRecords(
        ManifestDocument manifest,
        IAcceptedManifestTrainingRedactor redactor)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(redactor);

        List<string> decisionLines = [];

        foreach (ResolvedArchitectureDecision decision in manifest.Decisions)
        {
            if (string.IsNullOrWhiteSpace(decision.Title))
                continue;

            string title = redactor.RedactManifestText(decision.Title);
            string selected = redactor.RedactManifestText(decision.SelectedOption);
            string rationale = redactor.RedactManifestText(decision.Rationale);
            string category = redactor.RedactManifestText(decision.Category);

            string line = $"[{category}] {title}: selected {selected}. {rationale}".Trim();

            if (!string.IsNullOrWhiteSpace(line))
                decisionLines.Add(line);
        }

        PolicySection policy = manifest.Policy;

        if (policy.Violations.Count > 0 || policy.SatisfiedControls.Count > 0)
        {
            string policySummary =
                $"Policy satisfied={policy.SatisfiedControls.Count}, violations={policy.Violations.Count}.";

            decisionLines.Add(redactor.RedactManifestText(policySummary));
        }

        if (decisionLines.Count == 0)
            return [];

        string userPrompt = redactor.RedactManifestText(
            $"Summarize accepted architecture decisions for run {manifest.RunId:D}.");

        string assistantCompletion = string.Join("\n", decisionLines);
        string hashInput = $"{manifest.ManifestId:D}|{userPrompt}|{assistantCompletion}";
        string contentHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(hashInput)));

        FineTuningTrainingRecord record = new()
        {
            TenantId = manifest.TenantId,
            RunId = manifest.RunId,
            ManifestId = manifest.ManifestId,
            SystemPrompt = SystemPrompt,
            UserPrompt = userPrompt,
            AssistantCompletion = assistantCompletion,
            ContentHash = contentHash,
        };

        return [record];
    }
}
