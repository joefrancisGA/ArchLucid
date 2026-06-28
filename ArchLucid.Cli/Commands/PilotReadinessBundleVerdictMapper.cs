namespace ArchLucid.Cli.Commands;

internal static class PilotReadinessBundleVerdictMapper
{
    internal static PilotReadinessBundleSlotVerdict FromBuyerProof(BuyerProofEvidenceLedgerVerdict verdict) =>
        MapPassWarnFail(verdict switch
        {
            BuyerProofEvidenceLedgerVerdict.Pass => PilotReadinessBundleSlotVerdict.Pass,
            BuyerProofEvidenceLedgerVerdict.Warn => PilotReadinessBundleSlotVerdict.Warn,
            BuyerProofEvidenceLedgerVerdict.Fail => PilotReadinessBundleSlotVerdict.Fail,
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown buyer-proof verdict."),
        });

    internal static PilotReadinessBundleSlotVerdict FromReturnTrigger(ReturnTriggerTelemetryVerdict verdict) =>
        MapPassWarnFail(verdict switch
        {
            ReturnTriggerTelemetryVerdict.Pass => PilotReadinessBundleSlotVerdict.Pass,
            ReturnTriggerTelemetryVerdict.Warn => PilotReadinessBundleSlotVerdict.Warn,
            ReturnTriggerTelemetryVerdict.Fail => PilotReadinessBundleSlotVerdict.Fail,
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown return-trigger verdict."),
        });

    internal static PilotReadinessBundleSlotVerdict FromDecisionOwner(DecisionOwnerScoreboardVerdict verdict) =>
        MapPassWarnFail(verdict switch
        {
            DecisionOwnerScoreboardVerdict.Pass => PilotReadinessBundleSlotVerdict.Pass,
            DecisionOwnerScoreboardVerdict.Warn => PilotReadinessBundleSlotVerdict.Warn,
            DecisionOwnerScoreboardVerdict.Fail => PilotReadinessBundleSlotVerdict.Fail,
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown decision-owner verdict."),
        });

    internal static PilotReadinessBundleSlotVerdict FromFrontierAi(FrontierAiBaselineVerdict verdict) =>
        MapPassWarnFail(verdict switch
        {
            FrontierAiBaselineVerdict.Pass => PilotReadinessBundleSlotVerdict.Pass,
            FrontierAiBaselineVerdict.Warn => PilotReadinessBundleSlotVerdict.Warn,
            FrontierAiBaselineVerdict.Fail => PilotReadinessBundleSlotVerdict.Fail,
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown frontier-AI verdict."),
        });

    internal static PilotReadinessBundleSlotVerdict FromCitation(CitationIntegrityVerdict verdict) =>
        MapPassWarnFail(verdict switch
        {
            CitationIntegrityVerdict.Pass => PilotReadinessBundleSlotVerdict.Pass,
            CitationIntegrityVerdict.Warn => PilotReadinessBundleSlotVerdict.Warn,
            CitationIntegrityVerdict.Fail => PilotReadinessBundleSlotVerdict.Fail,
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown citation-integrity verdict."),
        });

    internal static PilotReadinessBundleSlotVerdict FromTenantIsolation(TenantIsolationNegativeTestVerdict verdict) =>
        verdict switch
        {
            TenantIsolationNegativeTestVerdict.Pass => PilotReadinessBundleSlotVerdict.Pass,
            TenantIsolationNegativeTestVerdict.Fail => PilotReadinessBundleSlotVerdict.Fail,
            TenantIsolationNegativeTestVerdict.Skip => PilotReadinessBundleSlotVerdict.Skipped,
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown tenant-isolation verdict."),
        };

    internal static PilotReadinessBundleSlotVerdict FromShipGate(ShipGateEvidenceVerdict verdict) =>
        verdict switch
        {
            ShipGateEvidenceVerdict.Pass => PilotReadinessBundleSlotVerdict.Pass,
            ShipGateEvidenceVerdict.Fail => PilotReadinessBundleSlotVerdict.Fail,
            ShipGateEvidenceVerdict.Unknown => PilotReadinessBundleSlotVerdict.Unknown,
            _ => throw new ArgumentOutOfRangeException(nameof(verdict), verdict, "Unknown ship-gate verdict."),
        };

    internal static PilotReadinessBundleSlotVerdict FromItsmPullForward(ItsmPullForwardReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        if (report.Checks.Any(static check => check.Evidence.StartsWith("Missing", StringComparison.Ordinal)))
            return PilotReadinessBundleSlotVerdict.Fail;

        return report.Recommendation switch
        {
            ItsmPullForwardVerdict.Hold => PilotReadinessBundleSlotVerdict.Pass,
            ItsmPullForwardVerdict.Watch => PilotReadinessBundleSlotVerdict.Warn,
            ItsmPullForwardVerdict.PullForward => PilotReadinessBundleSlotVerdict.Fail,
            _ => throw new ArgumentOutOfRangeException(
                nameof(report),
                report.Recommendation,
                "Unknown ITSM pull-forward verdict."),
        };
    }

    private static PilotReadinessBundleSlotVerdict MapPassWarnFail(PilotReadinessBundleSlotVerdict verdict) => verdict;
}
