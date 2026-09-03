using System.Globalization;
using System.Text;

namespace ArchLucid.Cli.Commands;

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
