using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Persistence.Governance;

public sealed partial class ArchitectureDecisionRegisterReader
{
    private static List<ArchitectureDecisionRegisterEntry> MapDecisionRows(IEnumerable<DecisionRow> rows)
    {
        List<ArchitectureDecisionRegisterEntry> decisions = [];

        foreach (DecisionRow row in rows)
        {
            decisions.Add(
                new ArchitectureDecisionRegisterEntry
                {
                    DecisionId = row.DecisionId,
                    ManifestId = row.ManifestId,
                    RunId = row.RunId,
                    Category = row.Category,
                    Title = row.Title,
                    SelectedOption = row.SelectedOption,
                    Rationale = row.Rationale,
                    Confidence = row.Confidence,
                    ConfidenceSource = row.ConfidenceSource,
                    BuyerConfidenceSource = DecisionConfidenceSourceMapper.ToBuyerLabel(row.ConfidenceSource),
                    RecordedAtUtc = new DateTimeOffset(DateTime.SpecifyKind(row.RecordedAtUtc, DateTimeKind.Utc)),
                    SupportingFindingIds = [],
                });
        }

        return decisions;
    }

    private static List<ArchitectureDecisionRegisterEntry> EnrichWithEvidence(
        List<ArchitectureDecisionRegisterEntry> decisions,
        IEnumerable<EvidenceRow> evidence)
    {
        Dictionary<string, List<string>> byManifestDecision = new(StringComparer.OrdinalIgnoreCase);

        foreach (EvidenceRow er in evidence)
        {
            string key = $"{er.ManifestId:N}|{er.DecisionId}";

            if (!byManifestDecision.TryGetValue(key, out List<string>? list))
            {
                list = [];
                byManifestDecision[key] = list;
            }

            list.Add(er.FindingId);
        }

        List<ArchitectureDecisionRegisterEntry> enriched = [];

        foreach (ArchitectureDecisionRegisterEntry decision in decisions)
        {
            string key = $"{decision.ManifestId:N}|{decision.DecisionId}";
            byManifestDecision.TryGetValue(key, out List<string>? findingIds);
            findingIds ??= [];

            enriched.Add(
                new ArchitectureDecisionRegisterEntry
                {
                    DecisionId = decision.DecisionId,
                    ManifestId = decision.ManifestId,
                    RunId = decision.RunId,
                    Category = decision.Category,
                    Title = decision.Title,
                    SelectedOption = decision.SelectedOption,
                    Rationale = decision.Rationale,
                    Confidence = decision.Confidence,
                    ConfidenceSource = decision.ConfidenceSource,
                    BuyerConfidenceSource = decision.BuyerConfidenceSource,
                    RecordedAtUtc = decision.RecordedAtUtc,
                    SupportingFindingIds = findingIds,
                });
        }

        return enriched;
    }

    private sealed class DecisionRow
    {
        public string DecisionId
        {
            get;
            init;
        } = string.Empty;

        public string Category
        {
            get;
            init;
        } = string.Empty;

        public string Title
        {
            get;
            init;
        } = string.Empty;

        public string SelectedOption
        {
            get;
            init;
        } = string.Empty;

        public string Rationale
        {
            get;
            init;
        } = string.Empty;

        public double? Confidence
        {
            get;
            init;
        }

        public string? ConfidenceSource
        {
            get;
            init;
        }

        public Guid ManifestId
        {
            get;
            init;
        }

        public Guid RunId
        {
            get;
            init;
        }

        public DateTime RecordedAtUtc
        {
            get;
            init;
        }
    }

    private sealed class EvidenceRow
    {
        public Guid ManifestId
        {
            get;
            init;
        }

        public string DecisionId
        {
            get;
            init;
        } = string.Empty;

        public string FindingId
        {
            get;
            init;
        } = string.Empty;
    }
}
