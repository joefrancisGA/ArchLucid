namespace ArchLucid.Cli.Commands;

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
