using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Ledger JSON parsing for decision-owner scoreboard commands.
/// </summary>
internal static class DecisionOwnerScoreboardParseCore
{
    private const string LedgerSchema = "archlucid.pilot-decision-ledger.v1";

    internal static DecisionOwnerLedgerRecord? TryParseLedger(string filePath)
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

        List<DecisionOwnerLedgerDecision> decisions = [];

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

        List<DecisionOwnerLedgerChange> changes = [];

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
