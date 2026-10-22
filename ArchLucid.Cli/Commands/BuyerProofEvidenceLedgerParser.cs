using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static class BuyerProofEvidenceLedgerParser
{
    private const string DecisionLedgerSchema = "archlucid.pilot-decision-ledger.v1";
    private const string PaidPilotLedgerSchema = "archlucid.paid-pilot-evidence-ledger.v1";

    internal static BuyerProofEvidenceLedgerContext LoadDirectory(string proofDirectory)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(proofDirectory);

        if (!Directory.Exists(proofDirectory))
            return new BuyerProofEvidenceLedgerContext();

        string? runId = null;
        string? roiBasisStatus = null;
        bool? roiSponsorSafe = null;
        string? sponsorPacketDisposition = null;
        string? verdict = null;
        string? procurementDisposition = null;
        bool decisionLedgerPresent = false;
        bool noDecisionChangesConfirmed = false;
        int attributedDecisionChangeCount = 0;
        bool sponsorAcceptancePresent = false;
        bool paidPilotLedgerPresent = false;
        bool paidPilotBaselineConfidencePresent = false;
        bool paidPilotDecisionChangedPresent = false;
        bool paidPilotSponsorActionPresent = false;
        string? proofSendability = null;
        string? evidenceCompleteness = null;
        bool proofPackageCompletenessPresent = false;

        foreach (string filePath in Directory.EnumerateFiles(proofDirectory, "*.json", SearchOption.AllDirectories))
        {
            string fileName = Path.GetFileName(filePath);

            if (string.Equals(fileName, "go-no-go-summary.json", StringComparison.OrdinalIgnoreCase))
            {
                MergeGoNoGoSummary(filePath, ref runId, ref roiBasisStatus, ref roiSponsorSafe, ref sponsorPacketDisposition, ref verdict, ref procurementDisposition);
                continue;
            }

            if (string.Equals(fileName, "commercial-closeout.json", StringComparison.OrdinalIgnoreCase))
            {
                MergeCommercialCloseout(filePath, ref sponsorPacketDisposition, ref procurementDisposition);
                continue;
            }

            if (string.Equals(fileName, "proof-package-completeness.json", StringComparison.OrdinalIgnoreCase))
            {
                proofPackageCompletenessPresent = true;
                MergeProofPackageCompleteness(filePath, ref proofSendability, ref evidenceCompleteness);
                continue;
            }

            if (string.Equals(fileName, "pilot-decision-ledger.json", StringComparison.OrdinalIgnoreCase)
                || string.Equals(fileName, "ledger.json", StringComparison.OrdinalIgnoreCase))
            {
                MergeDecisionLedger(
                    filePath,
                    ref runId,
                    ref decisionLedgerPresent,
                    ref noDecisionChangesConfirmed,
                    ref attributedDecisionChangeCount,
                    ref sponsorAcceptancePresent);

                continue;
            }

            using JsonDocument document = JsonDocument.Parse(File.ReadAllText(filePath));
            JsonElement root = document.RootElement;

            if (!root.TryGetProperty("schema", out JsonElement schemaElement))
                continue;

            string schema = schemaElement.GetString() ?? string.Empty;

            if (string.Equals(schema, PaidPilotLedgerSchema, StringComparison.Ordinal))
            {
                paidPilotLedgerPresent = true;
                runId ??= ReadString(root, "runId");
                paidPilotBaselineConfidencePresent = root.TryGetProperty("baselineSourceConfidence", out JsonElement baseline)
                    && baseline.TryGetProperty("level", out JsonElement level)
                    && !string.IsNullOrWhiteSpace(level.GetString());
                paidPilotDecisionChangedPresent = root.TryGetProperty("decisionChanged", out JsonElement decisionChanged)
                    && decisionChanged.ValueKind == JsonValueKind.Object;
                paidPilotSponsorActionPresent = root.TryGetProperty("sponsorActionTaken", out JsonElement sponsorAction)
                    && sponsorAction.TryGetProperty("action", out JsonElement action)
                    && !string.IsNullOrWhiteSpace(action.GetString());
            }
        }

        return new BuyerProofEvidenceLedgerContext
        {
            RunId = runId,
            RoiBasisStatus = roiBasisStatus,
            RoiSponsorSafe = roiSponsorSafe,
            SponsorPacketDisposition = sponsorPacketDisposition,
            Verdict = verdict,
            ProcurementDisposition = procurementDisposition,
            DecisionLedgerPresent = decisionLedgerPresent,
            NoDecisionChangesConfirmed = noDecisionChangesConfirmed,
            AttributedDecisionChangeCount = attributedDecisionChangeCount,
            SponsorAcceptancePresent = sponsorAcceptancePresent,
            PaidPilotLedgerPresent = paidPilotLedgerPresent,
            PaidPilotBaselineConfidencePresent = paidPilotBaselineConfidencePresent,
            PaidPilotDecisionChangedPresent = paidPilotDecisionChangedPresent,
            PaidPilotSponsorActionPresent = paidPilotSponsorActionPresent,
            ProofSendability = proofSendability,
            EvidenceCompleteness = evidenceCompleteness,
            ProofPackageCompletenessPresent = proofPackageCompletenessPresent,
        };
    }

    private static void MergeGoNoGoSummary(
        string filePath,
        ref string? runId,
        ref string? roiBasisStatus,
        ref bool? roiSponsorSafe,
        ref string? sponsorPacketDisposition,
        ref string? verdict,
        ref string? procurementDisposition)
    {
        using JsonDocument document = JsonDocument.Parse(File.ReadAllText(filePath));
        JsonElement root = document.RootElement;

        runId ??= ReadString(root, "runId");
        roiBasisStatus ??= ReadString(root, "roiBasisStatus");
        roiSponsorSafe ??= ReadBool(root, "roiSponsorSafe");
        sponsorPacketDisposition ??= ReadString(root, "sponsorPacketDisposition");
        verdict ??= ReadString(root, "verdict");
        procurementDisposition ??= ReadString(root, "procurementDisposition");
    }

    private static void MergeCommercialCloseout(
        string filePath,
        ref string? sponsorPacketDisposition,
        ref string? procurementDisposition)
    {
        using JsonDocument document = JsonDocument.Parse(File.ReadAllText(filePath));
        JsonElement root = document.RootElement;

        sponsorPacketDisposition ??= ReadString(root, "sponsorPacketDisposition");
        procurementDisposition ??= ReadString(root, "procurementDisposition");
    }

    private static void MergeProofPackageCompleteness(
        string filePath,
        ref string? proofSendability,
        ref string? evidenceCompleteness)
    {
        using JsonDocument document = JsonDocument.Parse(File.ReadAllText(filePath));
        JsonElement root = document.RootElement;

        proofSendability ??= ReadString(root, "proofSendability");
        evidenceCompleteness ??= ReadString(root, "evidenceCompleteness");
    }

    private static void MergeDecisionLedger(
        string filePath,
        ref string? runId,
        ref bool decisionLedgerPresent,
        ref bool noDecisionChangesConfirmed,
        ref int attributedDecisionChangeCount,
        ref bool sponsorAcceptancePresent)
    {
        using JsonDocument document = JsonDocument.Parse(File.ReadAllText(filePath));
        JsonElement root = document.RootElement;

        if (!root.TryGetProperty("schema", out JsonElement schemaElement)
            || !string.Equals(schemaElement.GetString(), DecisionLedgerSchema, StringComparison.Ordinal))
        {
            return;
        }

        decisionLedgerPresent = true;
        runId ??= ReadString(root, "runId");
        noDecisionChangesConfirmed = root.TryGetProperty("noDecisionChangesConfirmed", out JsonElement noChangeElement)
            && noChangeElement.ValueKind == JsonValueKind.True;

        if (root.TryGetProperty("decisionChanges", out JsonElement changesElement)
            && changesElement.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement change in changesElement.EnumerateArray())
            {
                if (change.TryGetProperty("changedBecauseOfArchLucidFinding", out JsonElement attributedElement)
                    && attributedElement.ValueKind == JsonValueKind.True)
                {
                    attributedDecisionChangeCount++;
                }
            }
        }

        sponsorAcceptancePresent = root.TryGetProperty("sponsorAcceptance", out JsonElement sponsorElement)
            && sponsorElement.TryGetProperty("outcome", out JsonElement outcomeElement)
            && !string.IsNullOrWhiteSpace(outcomeElement.GetString());
    }

    private static string? ReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
            return null;

        return value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    }

    private static bool? ReadBool(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
            return null;

        if (value.ValueKind == JsonValueKind.True)
            return true;

        if (value.ValueKind == JsonValueKind.False)
            return false;

        return null;
    }
}
