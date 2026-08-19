using System.Globalization;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal sealed class DecisionOwnerScoreboardRules
{
    public int SchemaVersion { get; init; }

    public List<string> OwnerNotApplicableValues { get; init; } = [];

    public List<string> ResolvedOwnerOutcomes { get; init; } = [];

    public List<string> PendingOwnerOutcomes { get; init; } = [];

    public List<string> ValidOwnerOutcomes { get; init; } = [];
}

internal sealed class DecisionOwnerLedgerRecord
{
    public string SourcePath { get; init; } = string.Empty;

    public string? RunId { get; init; }

    public bool NoDecisionChangesConfirmed { get; init; }

    public IReadOnlyList<DecisionOwnerLedgerDecision> Decisions { get; init; } = [];

    public IReadOnlyList<DecisionOwnerLedgerChange> Changes { get; init; } = [];
}

internal sealed class DecisionOwnerLedgerDecision
{
    public string DecisionId { get; init; } = string.Empty;

    public string Title { get; init; } = string.Empty;

    public string? DecisionOwner { get; init; }

    public string? OwnerOutcome { get; init; }

    public DateTime? OutcomeRecordedUtc { get; init; }

    public string? ItsmTicketRef { get; init; }

    public DateTime? RemediationDueUtc { get; init; }
}

internal sealed class DecisionOwnerLedgerChange
{
    public string DecisionId { get; init; } = string.Empty;

    public bool ChangedBecauseOfArchLucidFinding { get; init; }

    public string? FindingId { get; init; }

    public string? EvidenceChainId { get; init; }
}

internal static class DecisionOwnerScoreboardRulesLoader
{
    private const string DefaultRulesFileName = "decision_owner_scoreboard_rules.v1.json";

    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static DecisionOwnerScoreboardRules Load(string? rulesFilePath)
    {
        string path = rulesFilePath ?? ResolveDefaultRulesPath();
        string json = File.ReadAllText(path);
        DecisionOwnerScoreboardRules? rules = JsonSerializer.Deserialize<DecisionOwnerScoreboardRules>(json, JsonRead)
            ?? throw new InvalidOperationException($"Decision-owner scoreboard rules are missing or empty: {path}");

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
            $"Decision-owner scoreboard rules not found (expected Data/{DefaultRulesFileName} next to the CLI assembly).",
            bundled);
    }
}

internal static class DecisionOwnerScoreboardParser
{
    private const string LedgerSchema = "archlucid.pilot-decision-ledger.v1";

    internal static IReadOnlyList<DecisionOwnerLedgerRecord> LoadDirectory(string ledgerDirectory)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(ledgerDirectory);

        if (!Directory.Exists(ledgerDirectory))
            return [];

        List<DecisionOwnerLedgerRecord> records = new();

        foreach (string filePath in Directory.EnumerateFiles(ledgerDirectory, "*.json", SearchOption.AllDirectories))
        {
            DecisionOwnerLedgerRecord? record = TryParseLedger(filePath);

            if (record is not null)
                records.Add(record);
        }

        return records
            .OrderBy(static record => record.SourcePath, StringComparer.Ordinal)
            .ToList();
    }

    private static DecisionOwnerLedgerRecord? TryParseLedger(string filePath)
    {
        using JsonDocument document = JsonDocument.Parse(File.ReadAllText(filePath));
        JsonElement root = document.RootElement;

        if (!root.TryGetProperty("schema", out JsonElement schemaElement)
            || !string.Equals(schemaElement.GetString(), LedgerSchema, StringComparison.Ordinal))
        {
            return null;
        }

        bool noDecisionChangesConfirmed = root.TryGetProperty("noDecisionChangesConfirmed", out JsonElement noChangeElement)
            && noChangeElement.ValueKind == JsonValueKind.True;

        List<DecisionOwnerLedgerDecision> decisions = new();

        if (root.TryGetProperty("decisionsUnderReview", out JsonElement decisionsElement)
            && decisionsElement.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement decisionElement in decisionsElement.EnumerateArray())
            {
                string decisionId = ReadString(decisionElement, "decisionId") ?? string.Empty;

                if (string.IsNullOrWhiteSpace(decisionId))
                    continue;

                decisions.Add(new DecisionOwnerLedgerDecision
                {
                    DecisionId = decisionId,
                    Title = ReadString(decisionElement, "title") ?? string.Empty,
                    DecisionOwner = ReadString(decisionElement, "decisionOwner"),
                    OwnerOutcome = ReadString(decisionElement, "ownerOutcome"),
                    OutcomeRecordedUtc = ReadDateTime(decisionElement, "outcomeRecordedUtc"),
                    ItsmTicketRef = ReadString(decisionElement, "itsmTicketRef"),
                    RemediationDueUtc = ReadDateTime(decisionElement, "remediationDueUtc"),
                });
            }
        }

        List<DecisionOwnerLedgerChange> changes = new();

        if (root.TryGetProperty("decisionChanges", out JsonElement changesElement)
            && changesElement.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement changeElement in changesElement.EnumerateArray())
            {
                string decisionId = ReadString(changeElement, "decisionId") ?? string.Empty;

                if (string.IsNullOrWhiteSpace(decisionId))
                    continue;

                changes.Add(new DecisionOwnerLedgerChange
                {
                    DecisionId = decisionId,
                    ChangedBecauseOfArchLucidFinding = changeElement.TryGetProperty(
                            "changedBecauseOfArchLucidFinding",
                            out JsonElement attributedElement)
                        && attributedElement.ValueKind == JsonValueKind.True,
                    FindingId = ReadString(changeElement, "findingId"),
                    EvidenceChainId = ReadString(changeElement, "evidenceChainId"),
                });
            }
        }

        return new DecisionOwnerLedgerRecord
        {
            SourcePath = filePath,
            RunId = ReadString(root, "runId"),
            NoDecisionChangesConfirmed = noDecisionChangesConfirmed,
            Decisions = decisions,
            Changes = changes,
        };
    }

    private static string? ReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
            return null;

        return value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    }

    private static DateTime? ReadDateTime(JsonElement element, string propertyName)
    {
        string? text = ReadString(element, propertyName);

        if (string.IsNullOrWhiteSpace(text))
            return null;

        if (DateTime.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out DateTime parsed))
            return parsed.ToUniversalTime();

        return null;
    }
}

internal static class DecisionOwnerScoreboardNormalizer
{
    internal static IReadOnlyList<DecisionOwnerScoreboardRow> BuildRows(
        IReadOnlyList<DecisionOwnerLedgerRecord> records,
        DecisionOwnerScoreboardRules rules,
        DateTime evaluationUtc)
    {
        ArgumentNullException.ThrowIfNull(records);
        ArgumentNullException.ThrowIfNull(rules);

        List<DecisionOwnerScoreboardRow> rows = new();

        foreach (DecisionOwnerLedgerRecord record in records)
        {
            Dictionary<string, DecisionOwnerLedgerChange> changesByDecisionId = record.Changes
                .Where(static change => change.ChangedBecauseOfArchLucidFinding)
                .GroupBy(static change => change.DecisionId, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    static group => group.Key,
                    static group => group.First(),
                    StringComparer.OrdinalIgnoreCase);

            foreach (DecisionOwnerLedgerDecision decision in record.Decisions)
            {
                changesByDecisionId.TryGetValue(decision.DecisionId, out DecisionOwnerLedgerChange? change);

                bool overdue = IsOverdue(decision, rules, evaluationUtc);
                string accountabilityStatus = ResolveAccountabilityStatus(decision, rules, overdue);

                rows.Add(new DecisionOwnerScoreboardRow
                {
                    DecisionId = decision.DecisionId,
                    Title = decision.Title,
                    DecisionOwner = decision.DecisionOwner,
                    LinkedFindingId = change?.FindingId,
                    EvidenceChainId = change?.EvidenceChainId,
                    OwnerOutcome = decision.OwnerOutcome,
                    OutcomeRecordedUtc = decision.OutcomeRecordedUtc,
                    ItsmTicketRef = decision.ItsmTicketRef,
                    RemediationDueUtc = decision.RemediationDueUtc,
                    Overdue = overdue,
                    AccountabilityStatus = accountabilityStatus,
                });
            }
        }

        return rows;
    }

    internal static DecisionOwnerScoreboardVerdict DeriveOverallVerdict(
        IReadOnlyList<DecisionOwnerScoreboardRow> rows,
        IReadOnlyList<DecisionOwnerLedgerRecord> records,
        DecisionOwnerScoreboardRules rules)
    {
        if (records.Count == 0)
            return DecisionOwnerScoreboardVerdict.Warn;

        if (records.Any(static record => record.NoDecisionChangesConfirmed) && rows.Count == 0)
            return DecisionOwnerScoreboardVerdict.Pass;

        if (rows.Any(static row => row.AccountabilityStatus == "unowned"))
            return DecisionOwnerScoreboardVerdict.Fail;

        if (rows.Any(static row => row.AccountabilityStatus == "owned-overdue"))
            return DecisionOwnerScoreboardVerdict.Fail;

        if (HasAttributedChangeMissingOutcome(records, rules))
            return DecisionOwnerScoreboardVerdict.Fail;

        if (rows.Any(static row => row.AccountabilityStatus == "owned-pending"))
            return DecisionOwnerScoreboardVerdict.Warn;

        if (rows.All(static row => row.AccountabilityStatus is "owned-and-resolved" or "not-applicable"))
            return DecisionOwnerScoreboardVerdict.Pass;

        return DecisionOwnerScoreboardVerdict.Warn;
    }

    internal static string BuildOperatorMarkdown(
        DecisionOwnerScoreboardReport report,
        DecisionOwnerScoreboardVerdict overallVerdict)
    {
        return BuildMarkdown(report, overallVerdict, sponsorSafe: false);
    }

    internal static string BuildSponsorMarkdown(
        DecisionOwnerScoreboardReport report,
        DecisionOwnerScoreboardVerdict overallVerdict)
    {
        return BuildMarkdown(report, overallVerdict, sponsorSafe: true);
    }

    private static bool HasAttributedChangeMissingOutcome(
        IReadOnlyList<DecisionOwnerLedgerRecord> records,
        DecisionOwnerScoreboardRules rules)
    {
        HashSet<string> resolvedOutcomes = rules.ResolvedOwnerOutcomes
            .Select(static outcome => outcome.ToLowerInvariant())
            .ToHashSet(StringComparer.Ordinal);

        foreach (DecisionOwnerLedgerRecord record in records)
        {
            HashSet<string> attributedDecisionIds = record.Changes
                .Where(static change => change.ChangedBecauseOfArchLucidFinding)
                .Select(static change => change.DecisionId)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (DecisionOwnerLedgerDecision decision in record.Decisions)
            {
                if (!attributedDecisionIds.Contains(decision.DecisionId))
                    continue;

                string outcome = decision.OwnerOutcome?.Trim().ToLowerInvariant() ?? string.Empty;

                if (string.IsNullOrWhiteSpace(outcome) || !resolvedOutcomes.Contains(outcome))
                    return true;
            }
        }

        return false;
    }

    private static bool IsOverdue(
        DecisionOwnerLedgerDecision decision,
        DecisionOwnerScoreboardRules rules,
        DateTime evaluationUtc)
    {
        if (decision.RemediationDueUtc is null)
            return false;

        string outcome = decision.OwnerOutcome?.Trim().ToLowerInvariant() ?? string.Empty;
        HashSet<string> resolvedOutcomes = rules.ResolvedOwnerOutcomes
            .Select(static value => value.ToLowerInvariant())
            .ToHashSet(StringComparer.Ordinal);

        if (resolvedOutcomes.Contains(outcome))
            return false;

        return decision.RemediationDueUtc.Value < evaluationUtc;
    }

    private static string ResolveAccountabilityStatus(
        DecisionOwnerLedgerDecision decision,
        DecisionOwnerScoreboardRules rules,
        bool overdue)
    {
        string owner = decision.DecisionOwner?.Trim() ?? string.Empty;
        HashSet<string> notApplicableOwners = rules.OwnerNotApplicableValues
            .Select(static value => value.ToLowerInvariant())
            .ToHashSet(StringComparer.Ordinal);

        if (notApplicableOwners.Contains(owner.ToLowerInvariant()))
            return "not-applicable";

        if (string.IsNullOrWhiteSpace(owner))
            return "unowned";

        if (overdue)
            return "owned-overdue";

        string outcome = decision.OwnerOutcome?.Trim().ToLowerInvariant() ?? string.Empty;
        HashSet<string> resolvedOutcomes = rules.ResolvedOwnerOutcomes
            .Select(static value => value.ToLowerInvariant())
            .ToHashSet(StringComparer.Ordinal);
        HashSet<string> pendingOutcomes = rules.PendingOwnerOutcomes
            .Select(static value => value.ToLowerInvariant())
            .ToHashSet(StringComparer.Ordinal);

        if (resolvedOutcomes.Contains(outcome))
            return "owned-and-resolved";

        if (pendingOutcomes.Contains(outcome) || string.IsNullOrWhiteSpace(outcome))
            return "owned-pending";

        return "owned-pending";
    }

    private static string BuildMarkdown(
        DecisionOwnerScoreboardReport report,
        DecisionOwnerScoreboardVerdict overallVerdict,
        bool sponsorSafe)
    {
        StringBuilder sb = new();

        sb.AppendLine(sponsorSafe
            ? "# Decision-owner accountability (buyer-safe summary)"
            : "# Decision-owner accountability scoreboard");
        sb.AppendLine();
        sb.AppendLine($"Generated (UTC): {report.GeneratedUtc:O}");
        sb.AppendLine($"Overall verdict: **{FormatVerdict(overallVerdict)}**");
        sb.AppendLine();

        if (sponsorSafe && overallVerdict == DecisionOwnerScoreboardVerdict.Fail)
        {
            sb.AppendLine("> Sponsor render withheld — resolve FAIL accountability rows before external circulation.");
            sb.AppendLine();

            return sb.ToString();
        }

        sb.AppendLine("| Decision | Owner | Outcome | Status | Due (UTC) |");
        sb.AppendLine("| --- | --- | --- | --- | --- |");

        foreach (DecisionOwnerScoreboardRow row in report.Rows)
        {
            string due = row.RemediationDueUtc?.ToString("O", CultureInfo.InvariantCulture) ?? "—";

            sb.AppendLine(
                $"| {row.Title} | {row.DecisionOwner ?? "—"} | {row.OwnerOutcome ?? "—"} | {row.AccountabilityStatus} | {due} |");
        }

        sb.AppendLine();

        if (!sponsorSafe)
        {
            sb.AppendLine("## Row detail");
            sb.AppendLine();

            foreach (DecisionOwnerScoreboardRow row in report.Rows)
            {
                sb.AppendLine($"### {row.DecisionId} — {row.Title}");
                sb.AppendLine($"- Finding: `{row.LinkedFindingId ?? "—"}`");
                sb.AppendLine($"- Evidence chain: `{row.EvidenceChainId ?? "—"}`");
                sb.AppendLine($"- ITSM ref: `{row.ItsmTicketRef ?? "—"}`");
                sb.AppendLine($"- Overdue: {row.Overdue}");
                sb.AppendLine();
            }
        }

        return sb.ToString();
    }

    private static string FormatVerdict(DecisionOwnerScoreboardVerdict verdict)
    {
        return verdict switch
        {
            DecisionOwnerScoreboardVerdict.Pass => "PASS",
            DecisionOwnerScoreboardVerdict.Warn => "WARN",
            DecisionOwnerScoreboardVerdict.Fail => "FAIL",
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown decision-owner scoreboard verdict."),
        };
    }
}
