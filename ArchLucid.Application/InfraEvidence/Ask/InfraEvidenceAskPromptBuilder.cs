using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Ask;

internal static class InfraEvidenceAskPromptBuilder
{
    public const string SimulatorLabel =
        "SIMULATOR — deterministic template grounded on cited structured rows only.";

    private const string SystemPrompt =
        "You are an enterprise cloud architect answering questions from structured infrastructure-evidence rows. "
        + "Use ONLY the provided evidence lines. Do not invent Azure resource ids, change ids, or finding ids. "
        + "Return ONLY JSON: {\"answer\":\"...\",\"citationIds\":[\"kind:id\",...],"
        + "\"viewPlan\":{\"mermaidMode\":\"executive|network|identity|data|full|resourceGroup|dependencyNeighborhood\","
        + "\"resourceGroupName\":null,\"seedNodeId\":null,\"snapshotId\":null,\"cloudResourceId\":null,"
        + "\"fitTargetNodeId\":null,\"honestyLabel\":\"Proposed view — existing diagram modes only\"}} "
        + "where citationIds must be chosen from the allowedCitationIds list and viewPlan is optional for DiagramView topics.";

    public static string BuildSystemPrompt() => SystemPrompt;

    public static string BuildUserPrompt(string question, string topicKind, InfraEvidenceAskEvidenceBundle bundle)
    {
        StringBuilder builder = new();
        builder.AppendLine($"topicKind={topicKind}");
        builder.AppendLine($"question={question.Trim()}");
        builder.AppendLine("allowedMermaidModes:");

        foreach (string mode in DiagramViewPlanValidator.AllowedMermaidModes)
            builder.AppendLine($"  {mode}");

        builder.AppendLine("allowedCitationIds:");

        foreach (InfraEvidenceAskCitation citation in bundle.Citations)
            builder.AppendLine($"  {FormatCitationKey(citation)}");

        builder.AppendLine("evidenceRows:");

        foreach (string line in bundle.EvidenceLines)
            builder.AppendLine($"  {line}");

        return builder.ToString();
    }

    public static string BuildSimulatorAnswer(string question, InfraEvidenceAskEvidenceBundle bundle)
    {
        if (bundle.Citations.Count == 0)
            return "Insufficient structured evidence is available to answer this question.";

        string cited = string.Join(", ", bundle.Citations.Take(5).Select(FormatCitationKey));
        return $"Based on {bundle.Citations.Count} structured evidence row(s), the answer to \"{question.Trim()}\" "
            + $"is grounded on: {cited}. No ARM resources were invented beyond cited rows.";
    }

    public static IReadOnlyList<InfraEvidenceAskCitation> SelectSimulatorCitations(InfraEvidenceAskEvidenceBundle bundle)
        => bundle.Citations.Take(5).ToList();

    public static DiagramViewPlan? BuildSimulatorViewPlan(
        string question,
        InfraEvidenceAskRequest request,
        InfraEvidenceAskEvidenceBundle bundle)
    {
        if (bundle.TopicKind != InfraEvidenceAskTopicKinds.DiagramView)
            return null;

        string normalizedQuestion = question.Trim();
        HashSet<string> allowedSeeds = DiagramViewPlanValidator.ExtractAllowedSeedNodeIds(bundle);
        HashSet<string> outlineLabels = ExtractOutlineLabels(bundle);

        DiagramViewPlan plan = new()
        {
            SnapshotId = request.SnapshotId,
            CloudResourceId = request.CloudResourceId,
            HonestyLabel = DiagramViewPlanValidator.DefaultHonestyLabel,
        };

        if (ContainsAny(normalizedQuestion, "identity"))
            plan.MermaidMode = "identity";
        else if (ContainsAny(normalizedQuestion, "data"))
            plan.MermaidMode = "data";
        else if (ContainsAny(normalizedQuestion, "executive"))
            plan.MermaidMode = "executive";
        else if (ContainsAny(normalizedQuestion, "peering", "vnet", "network"))
            plan.MermaidMode = "network";
        else if (ContainsAny(normalizedQuestion, "resource group", "resourcegroup"))
        {
            plan.MermaidMode = "resourceGroup";
            plan.ResourceGroupName = ResolveResourceGroupNameFromEvidence(bundle);
        }
        else if (ContainsAny(normalizedQuestion, "how does", "how do", "connect", "reach"))
        {
            string? matchedSeed = ResolveSeedFromQuestion(normalizedQuestion, allowedSeeds, outlineLabels);

            if (matchedSeed is null)
                return null;

            plan.MermaidMode = "dependencyNeighborhood";
            plan.SeedNodeId = matchedSeed;
            plan.FitTargetNodeId = matchedSeed;
        }
        else if (ContainsAny(normalizedQuestion, "neighborhood of", "focus on"))
        {
            string? matchedSeed = ResolveSeedFromQuestion(normalizedQuestion, allowedSeeds, outlineLabels);

            if (matchedSeed is null)
                return null;

            plan.MermaidMode = "dependencyNeighborhood";
            plan.SeedNodeId = matchedSeed;
            plan.FitTargetNodeId = matchedSeed;
        }
        else if (ContainsAny(normalizedQuestion, "full"))
            plan.MermaidMode = "full";
        else
            plan.MermaidMode = "executive";

        if (!DiagramViewPlanValidator.TryValidate(plan, allowedSeeds, out _))
            return null;

        return plan;
    }

    public static bool TryParseLlmResponse(
        string llmJson,
        InfraEvidenceAskEvidenceBundle bundle,
        out string answer,
        out IReadOnlyList<InfraEvidenceAskCitation> citations,
        out DiagramViewPlan? viewPlan)
    {
        answer = string.Empty;
        citations = [];
        viewPlan = null;

        try
        {
            InfraEvidenceAskLlmResponse? parsed =
                JsonSerializer.Deserialize<InfraEvidenceAskLlmResponse>(llmJson, JsonOptions);

            if (parsed is null || string.IsNullOrWhiteSpace(parsed.Answer))
                return false;

            answer = parsed.Answer.Trim();
            HashSet<string> allowed = bundle.Citations.Select(FormatCitationKey).ToHashSet(StringComparer.OrdinalIgnoreCase);
            List<InfraEvidenceAskCitation> selected = [];

            foreach (string citationId in parsed.CitationIds)
            {
                if (!allowed.Contains(citationId))
                    continue;

                InfraEvidenceAskCitation? match = bundle.Citations.FirstOrDefault(
                    citation => string.Equals(FormatCitationKey(citation), citationId, StringComparison.OrdinalIgnoreCase));

                if (match is not null)
                    selected.Add(match);
            }

            citations = selected;

            if (parsed.ViewPlan is not null)
            {
                viewPlan = new DiagramViewPlan
                {
                    MermaidMode = parsed.ViewPlan.MermaidMode ?? string.Empty,
                    ResourceGroupName = parsed.ViewPlan.ResourceGroupName,
                    SeedNodeId = parsed.ViewPlan.SeedNodeId,
                    SnapshotId = parsed.ViewPlan.SnapshotId,
                    CloudResourceId = parsed.ViewPlan.CloudResourceId,
                    FitTargetNodeId = parsed.ViewPlan.FitTargetNodeId,
                    HonestyLabel = string.IsNullOrWhiteSpace(parsed.ViewPlan.HonestyLabel)
                        ? DiagramViewPlanValidator.DefaultHonestyLabel
                        : parsed.ViewPlan.HonestyLabel.Trim(),
                };
            }

            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    public static string FormatCitationKey(InfraEvidenceAskCitation citation)
        => $"{citation.Kind}:{citation.Id}";

    private static HashSet<string> ExtractOutlineLabels(InfraEvidenceAskEvidenceBundle bundle)
    {
        HashSet<string> labels = new(StringComparer.OrdinalIgnoreCase);

        foreach (InfraEvidenceAskCitation citation in bundle.Citations)
        {
            if (!string.IsNullOrWhiteSpace(citation.Label))
                labels.Add(citation.Label.Trim());
        }

        return labels;
    }

    private static string? ResolveResourceGroupNameFromEvidence(InfraEvidenceAskEvidenceBundle bundle)
    {
        foreach (string line in bundle.EvidenceLines)
        {
            if (!line.StartsWith("resourceGroupName=", StringComparison.Ordinal))
                continue;

            string name = line["resourceGroupName=".Length..].Trim();

            if (name.Length > 0)
                return name;
        }

        return null;
    }

    private static string? ResolveSeedFromQuestion(
        string question,
        IReadOnlySet<string> allowedSeeds,
        IReadOnlySet<string> outlineLabels)
    {
        foreach (string seed in allowedSeeds)
        {
            if (question.Contains(seed, StringComparison.OrdinalIgnoreCase))
                return seed;
        }

        foreach (string label in outlineLabels)
        {
            if (label.Length < 3)
                continue;

            if (question.Contains(label, StringComparison.OrdinalIgnoreCase))
            {
                if (allowedSeeds.Contains(label))
                    return label;
            }
        }

        return null;
    }

    private static bool ContainsAny(string question, params string[] needles)
    {
        foreach (string needle in needles)
        {
            if (question.Contains(needle, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private sealed class InfraEvidenceAskLlmResponse
    {
        public string Answer
        {
            get;
            set;
        } = string.Empty;

        public List<string> CitationIds
        {
            get;
            set;
        } = [];

        public InfraEvidenceAskLlmViewPlanResponse? ViewPlan
        {
            get;
            set;
        }
    }

    private sealed class InfraEvidenceAskLlmViewPlanResponse
    {
        public string? MermaidMode
        {
            get;
            set;
        }

        public string? ResourceGroupName
        {
            get;
            set;
        }

        public string? SeedNodeId
        {
            get;
            set;
        }

        public Guid? SnapshotId
        {
            get;
            set;
        }

        public Guid? CloudResourceId
        {
            get;
            set;
        }

        public string? FitTargetNodeId
        {
            get;
            set;
        }

        public string? HonestyLabel
        {
            get;
            set;
        }
    }
}
