using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal sealed class BuyerProofEvidenceLedgerContext
{
    public string? RunId { get; init; }

    public string? RoiBasisStatus { get; init; }

    public bool? RoiSponsorSafe { get; init; }

    public string? SponsorPacketDisposition { get; init; }

    public string? Verdict { get; init; }

    public string? ProcurementDisposition { get; init; }

    public bool DecisionLedgerPresent { get; init; }

    public bool NoDecisionChangesConfirmed { get; init; }

    public int AttributedDecisionChangeCount { get; init; }

    public bool SponsorAcceptancePresent { get; init; }

    public bool PaidPilotLedgerPresent { get; init; }

    public bool PaidPilotBaselineConfidencePresent { get; init; }

    public bool PaidPilotDecisionChangedPresent { get; init; }

    public bool PaidPilotSponsorActionPresent { get; init; }

    public string? ProofSendability { get; init; }

    public string? EvidenceCompleteness { get; init; }

    public bool ProofPackageCompletenessPresent { get; init; }
}

internal sealed class BuyerProofEvidenceLedgerRules
{
    public int SchemaVersion { get; init; }

    public List<BuyerProofEvidenceLedgerSlotRule> CanonicalSlots { get; init; } = [];

    public List<string> RoiBasisIncompleteValues { get; init; } = [];

    public List<string> SponsorSendDispositions { get; init; } = [];

    public List<string> ProcurementPassDispositions { get; init; } = [];

    public List<string> ProofSendableValues { get; init; } = [];
}

internal sealed class BuyerProofEvidenceLedgerSlotRule
{
    public string Id { get; init; } = string.Empty;

    public string Label { get; init; } = string.Empty;

    public bool RequiredForSponsorSend { get; init; }
}

internal static class BuyerProofEvidenceLedgerRulesLoader
{
    private const string DefaultRulesFileName = "buyer_proof_evidence_ledger_rules.v1.json";

    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static BuyerProofEvidenceLedgerRules Load(string? rulesFilePath)
    {
        string path = rulesFilePath ?? ResolveDefaultRulesPath();
        string json = File.ReadAllText(path);
        BuyerProofEvidenceLedgerRules? rules = JsonSerializer.Deserialize<BuyerProofEvidenceLedgerRules>(json, JsonRead)
            ?? throw new InvalidOperationException($"Buyer-proof evidence ledger rules are missing or empty: {path}");

        if (rules.CanonicalSlots.Count == 0)
            throw new InvalidOperationException($"Buyer-proof evidence ledger rules must define canonicalSlots: {path}");

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
            $"Buyer-proof evidence ledger rules not found (expected Data/{DefaultRulesFileName} next to the CLI assembly).",
            bundled);
    }
}

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

internal static class BuyerProofEvidenceLedgerNormalizer
{
    internal static IReadOnlyList<BuyerProofEvidenceLedgerSlotStatus> NormalizeSlots(
        BuyerProofEvidenceLedgerContext context,
        BuyerProofEvidenceLedgerRules rules)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(rules);

        List<BuyerProofEvidenceLedgerSlotStatus> slots = new();

        foreach (BuyerProofEvidenceLedgerSlotRule slotRule in rules.CanonicalSlots)
        {
            BuyerProofEvidenceLedgerSlotStatus slot = slotRule.Id switch
            {
                "committed-run" => EvaluateCommittedRun(context, slotRule),
                "roi-basis-labeled" => EvaluateRoiBasis(context, rules, slotRule),
                "sponsor-packet-disposition" => EvaluateSponsorDisposition(context, rules, slotRule),
                "decision-ledger-attributed" => EvaluateDecisionLedger(context, slotRule),
                "paid-pilot-evidence-row" => EvaluatePaidPilotLedger(context, slotRule),
                "procurement-deal-ready" => EvaluateProcurement(context, rules, slotRule),
                "proof-package-completeness" => EvaluateProofCompleteness(context, rules, slotRule),
                _ => throw new InvalidOperationException($"Unknown buyer-proof evidence slot: {slotRule.Id}"),
            };

            slots.Add(slot);
        }

        return slots;
    }

    internal static BuyerProofEvidenceLedgerVerdict DeriveOverallVerdict(
        IReadOnlyList<BuyerProofEvidenceLedgerCheckResult> checks,
        IReadOnlyList<BuyerProofEvidenceLedgerSlotStatus> slots)
    {
        if (checks.Any(static check => check.Verdict == BuyerProofEvidenceLedgerVerdict.Fail))
            return BuyerProofEvidenceLedgerVerdict.Fail;

        if (slots.Any(static slot => slot.RequiredForSponsorSend && slot.Verdict == BuyerProofEvidenceLedgerVerdict.Fail))
            return BuyerProofEvidenceLedgerVerdict.Fail;

        if (checks.Any(static check => check.Verdict == BuyerProofEvidenceLedgerVerdict.Warn)
            || slots.Any(static slot => slot.Verdict == BuyerProofEvidenceLedgerVerdict.Warn))
        {
            return BuyerProofEvidenceLedgerVerdict.Warn;
        }

        return BuyerProofEvidenceLedgerVerdict.Pass;
    }

    private static BuyerProofEvidenceLedgerSlotStatus EvaluateCommittedRun(
        BuyerProofEvidenceLedgerContext context,
        BuyerProofEvidenceLedgerSlotRule slotRule)
    {
        if (!string.IsNullOrWhiteSpace(context.RunId))
        {
            return Complete(slotRule, $"runId={context.RunId}");
        }

        return Missing(slotRule, "No committed runId found in go-no-go-summary or decision ledger.");
    }

    private static BuyerProofEvidenceLedgerSlotStatus EvaluateRoiBasis(
        BuyerProofEvidenceLedgerContext context,
        BuyerProofEvidenceLedgerRules rules,
        BuyerProofEvidenceLedgerSlotRule slotRule)
    {
        string basis = context.RoiBasisStatus?.Trim() ?? "not-collected";
        HashSet<string> incomplete = rules.RoiBasisIncompleteValues
            .Select(static value => value.ToLowerInvariant())
            .ToHashSet(StringComparer.Ordinal);

        if (incomplete.Contains(basis.ToLowerInvariant()))
        {
            return Fail(slotRule, $"roiBasisStatus={basis}", "Capture buyer ROI baselines or label conservative caveats.");
        }

        if (context.RoiSponsorSafe == false)
        {
            return Warn(slotRule, "Partial", $"roiBasisStatus={basis}; roiSponsorSafe=false", "Attach sponsor-safe ROI caveats before projected dollars lead.");
        }

        return Complete(slotRule, $"roiBasisStatus={basis}; roiSponsorSafe={context.RoiSponsorSafe?.ToString() ?? "unknown"}");
    }

    private static BuyerProofEvidenceLedgerSlotStatus EvaluateSponsorDisposition(
        BuyerProofEvidenceLedgerContext context,
        BuyerProofEvidenceLedgerRules rules,
        BuyerProofEvidenceLedgerSlotRule slotRule)
    {
        string disposition = (context.SponsorPacketDisposition ?? context.Verdict ?? string.Empty).Trim().ToUpperInvariant();
        HashSet<string> sendValues = rules.SponsorSendDispositions
            .Select(static value => value.ToUpperInvariant())
            .ToHashSet(StringComparer.Ordinal);

        if (sendValues.Contains(disposition))
            return Complete(slotRule, $"sponsorPacketDisposition={disposition}");

        if (string.IsNullOrWhiteSpace(disposition))
            return Missing(slotRule, "sponsorPacketDisposition missing from go-no-go-summary or commercial-closeout.");

        return Fail(slotRule, $"sponsorPacketDisposition={disposition}", "Resolve BLOCK/HOLD findings before sponsor send.");
    }

    private static BuyerProofEvidenceLedgerSlotStatus EvaluateDecisionLedger(
        BuyerProofEvidenceLedgerContext context,
        BuyerProofEvidenceLedgerSlotRule slotRule)
    {
        if (!context.DecisionLedgerPresent)
            return Missing(slotRule, "pilot-decision-ledger.json not found in proof directory.");

        if (context.NoDecisionChangesConfirmed)
            return Complete(slotRule, "noDecisionChangesConfirmed=true");

        if (context.AttributedDecisionChangeCount > 0)
        {
            if (context.SponsorAcceptancePresent)
            {
                return Complete(
                    slotRule,
                    $"attributedChanges={context.AttributedDecisionChangeCount}; sponsorAcceptance present");
            }

            return Warn(
                slotRule,
                "Partial",
                $"attributedChanges={context.AttributedDecisionChangeCount}; sponsorAcceptance missing",
                "Record sponsorAcceptance.outcome for attributed decision changes.");
        }

        return Fail(
            slotRule,
            "Decision ledger present without attribution or explicit no-change confirmation.",
            "Attribute at least one decision change or set noDecisionChangesConfirmed=true.");
    }

    private static BuyerProofEvidenceLedgerSlotStatus EvaluatePaidPilotLedger(
        BuyerProofEvidenceLedgerContext context,
        BuyerProofEvidenceLedgerSlotRule slotRule)
    {
        if (!context.PaidPilotLedgerPresent)
        {
            return Warn(slotRule, "Optional", "No paid-pilot evidence ledger row in proof directory.", "File ledger-row.json for paid pilot conversion tracking.");
        }

        bool complete = context.PaidPilotBaselineConfidencePresent
            && context.PaidPilotDecisionChangedPresent
            && context.PaidPilotSponsorActionPresent;

        if (complete)
            return Complete(slotRule, "baselineSourceConfidence, decisionChanged, and sponsorActionTaken present");

        return Warn(
            slotRule,
            "Partial",
            "Paid-pilot ledger row missing baseline confidence, decisionChanged, or sponsorActionTaken.",
            "Complete PAID_PILOT_EVIDENCE_LEDGER.md required fields before monthly rollup.");
    }

    private static BuyerProofEvidenceLedgerSlotStatus EvaluateProcurement(
        BuyerProofEvidenceLedgerContext context,
        BuyerProofEvidenceLedgerRules rules,
        BuyerProofEvidenceLedgerSlotRule slotRule)
    {
        string disposition = (context.ProcurementDisposition ?? string.Empty).Trim().ToUpperInvariant();
        HashSet<string> passValues = rules.ProcurementPassDispositions
            .Select(static value => value.ToUpperInvariant())
            .ToHashSet(StringComparer.Ordinal);

        if (passValues.Contains(disposition))
            return Complete(slotRule, $"procurementDisposition={disposition}");

        if (string.IsNullOrWhiteSpace(disposition))
            return Missing(slotRule, "procurementDisposition missing from go-no-go-summary or commercial-closeout.");

        return Fail(slotRule, $"procurementDisposition={disposition}", "Run build_procurement_pack.py --deal-ready before procurement reviewers receive the packet.");
    }

    private static BuyerProofEvidenceLedgerSlotStatus EvaluateProofCompleteness(
        BuyerProofEvidenceLedgerContext context,
        BuyerProofEvidenceLedgerRules rules,
        BuyerProofEvidenceLedgerSlotRule slotRule)
    {
        if (!context.ProofPackageCompletenessPresent)
        {
            return Warn(
                slotRule,
                "Optional",
                "proof-package-completeness.json not exported in proof directory.",
                "Export proofPackageCompleteness from pilot run deltas for operator parity.");
        }

        string sendability = context.ProofSendability ?? string.Empty;
        HashSet<string> sendable = rules.ProofSendableValues.ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (sendable.Contains(sendability))
        {
            return Complete(
                slotRule,
                $"proofSendability={sendability}; evidenceCompleteness={context.EvidenceCompleteness ?? "unknown"}");
        }

        return Fail(
            slotRule,
            $"proofSendability={sendability}",
            "Resolve proof-package completeness gaps before sponsor circulation.");
    }

    private static BuyerProofEvidenceLedgerSlotStatus Complete(BuyerProofEvidenceLedgerSlotRule slotRule, string evidence)
    {
        return new BuyerProofEvidenceLedgerSlotStatus
        {
            SlotId = slotRule.Id,
            Label = slotRule.Label,
            Verdict = BuyerProofEvidenceLedgerVerdict.Pass,
            NormalizedStatus = "Complete",
            Evidence = evidence,
            RequiredForSponsorSend = slotRule.RequiredForSponsorSend,
        };
    }

    private static BuyerProofEvidenceLedgerSlotStatus Warn(
        BuyerProofEvidenceLedgerSlotRule slotRule,
        string normalizedStatus,
        string evidence,
        string? resolution = null)
    {
        return new BuyerProofEvidenceLedgerSlotStatus
        {
            SlotId = slotRule.Id,
            Label = slotRule.Label,
            Verdict = BuyerProofEvidenceLedgerVerdict.Warn,
            NormalizedStatus = normalizedStatus,
            Evidence = string.IsNullOrWhiteSpace(resolution) ? evidence : $"{evidence} Next: {resolution}",
            RequiredForSponsorSend = slotRule.RequiredForSponsorSend,
        };
    }

    private static BuyerProofEvidenceLedgerSlotStatus Fail(
        BuyerProofEvidenceLedgerSlotRule slotRule,
        string evidence,
        string resolution)
    {
        return new BuyerProofEvidenceLedgerSlotStatus
        {
            SlotId = slotRule.Id,
            Label = slotRule.Label,
            Verdict = BuyerProofEvidenceLedgerVerdict.Fail,
            NormalizedStatus = "Incomplete",
            Evidence = $"{evidence} Next: {resolution}",
            RequiredForSponsorSend = slotRule.RequiredForSponsorSend,
        };
    }

    private static BuyerProofEvidenceLedgerSlotStatus Missing(BuyerProofEvidenceLedgerSlotRule slotRule, string evidence)
    {
        BuyerProofEvidenceLedgerVerdict verdict = slotRule.RequiredForSponsorSend
            ? BuyerProofEvidenceLedgerVerdict.Fail
            : BuyerProofEvidenceLedgerVerdict.Warn;

        return new BuyerProofEvidenceLedgerSlotStatus
        {
            SlotId = slotRule.Id,
            Label = slotRule.Label,
            Verdict = verdict,
            NormalizedStatus = "Missing",
            Evidence = evidence,
            RequiredForSponsorSend = slotRule.RequiredForSponsorSend,
        };
    }
}
