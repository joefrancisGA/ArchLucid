using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

namespace ArchLucid.Application.Architecture;

/// <summary>Maps guard and operational signals to public Quick Scan capacity UX states (TB-900).</summary>
public static class QuickScanPublicCapacityStateResolver
{
    public sealed record Resolution(
        QuickScanPublicCapacityState State,
        string Message,
        bool AiExecutionAllowed,
        bool SampleResultAvailable);

    public static Resolution Resolve(
        QuickScanSafetyOperationalSnapshot? operational,
        QuickScanGuardDecision guardDecision,
        QuickScanSafetyOptions safetyOptions)
    {
        ArgumentNullException.ThrowIfNull(guardDecision);
        ArgumentNullException.ThrowIfNull(safetyOptions);

        QuickScanSafetyOperationalSnapshot resolvedOperational = operational
            ?? QuickScanSafetyOperationalSnapshot.NormalExecution(safetyOptions);

        if (!resolvedOperational.StoreHealthy)
        {
            return Build(
                QuickScanPublicCapacityState.TemporarilyUnavailable,
                resolvedOperational.PublicMessage,
                safetyOptions.EmergencyDisabledMessage,
                aiExecutionAllowed: false,
                sampleAvailable: resolvedOperational.SampleResultAvailable);
        }

        if (resolvedOperational.Mode == QuickScanSafetyOperationalMode.SampleOnly)
        {
            return Build(
                QuickScanPublicCapacityState.SampleOnly,
                resolvedOperational.PublicMessage,
                "Quick Scan is in sample-only mode. View the illustrative sample below.",
                aiExecutionAllowed: false,
                sampleAvailable: true);
        }

        if (resolvedOperational.Mode == QuickScanSafetyOperationalMode.EmergencyDisabled
            || resolvedOperational.Mode == QuickScanSafetyOperationalMode.Disabled)
        {
            return Build(
                QuickScanPublicCapacityState.TemporarilyUnavailable,
                resolvedOperational.PublicMessage,
                safetyOptions.EmergencyDisabledMessage,
                aiExecutionAllowed: false,
                sampleAvailable: resolvedOperational.SampleResultAvailable);
        }

        if (!resolvedOperational.AnonymousExecutionAllowed)
        {
            return Build(
                QuickScanPublicCapacityState.TemporarilyUnavailable,
                resolvedOperational.PublicMessage,
                safetyOptions.EmergencyDisabledMessage,
                aiExecutionAllowed: false,
                sampleAvailable: resolvedOperational.SampleResultAvailable);
        }

        if (!guardDecision.Allowed)
        {
            return MapGuardRejection(
                guardDecision.RejectionReason!.Value,
                resolvedOperational.SampleResultAvailable);
        }

        return Build(
            QuickScanPublicCapacityState.Available,
            publicMessage: null,
            defaultMessage: "Quick Scan is available.",
            aiExecutionAllowed: true,
            sampleAvailable: resolvedOperational.SampleResultAvailable);
    }

    private static Resolution MapGuardRejection(
        QuickScanGuardRejectionReason reason,
        bool sampleAvailable)
    {
        if (reason is QuickScanGuardRejectionReason.SignInRequired
            or QuickScanGuardRejectionReason.CaptchaRequired)
        {
            return Build(
                QuickScanPublicCapacityState.VerificationRequired,
                publicMessage: null,
                reason == QuickScanGuardRejectionReason.CaptchaRequired
                    ? "Complete the security check to continue with Quick Scan."
                    : "Additional Quick Scan attempts require sign-in.",
                aiExecutionAllowed: false,
                sampleAvailable: sampleAvailable);
        }

        if (reason == QuickScanGuardRejectionReason.SuspiciousActivity)
        {
            return Build(
                QuickScanPublicCapacityState.AnonymousLimit,
                publicMessage: null,
                "Quick Scan is temporarily unavailable due to unusual activity. View the sample result or try again later.",
                aiExecutionAllowed: false,
                sampleAvailable: sampleAvailable);
        }

        if (reason is QuickScanGuardRejectionReason.GlobalHourlySpendCeiling
            or QuickScanGuardRejectionReason.GlobalDailySpendCeiling
            or QuickScanGuardRejectionReason.GlobalHourlyRequestLimit
            or QuickScanGuardRejectionReason.GlobalDailyRequestLimit)
        {
            return Build(
                QuickScanPublicCapacityState.DemonstrationCapacity,
                publicMessage: null,
                "Quick Scan has reached its demonstration capacity for today.",
                aiExecutionAllowed: false,
                sampleAvailable: sampleAvailable);
        }

        if (reason == QuickScanGuardRejectionReason.ConcurrentScanLimit)
        {
            return Build(
                QuickScanPublicCapacityState.Busy,
                publicMessage: null,
                "Quick Scan is busy right now. View the sample result or try again in a moment.",
                aiExecutionAllowed: false,
                sampleAvailable: sampleAvailable);
        }

        if (reason == QuickScanGuardRejectionReason.Disabled)
        {
            return Build(
                QuickScanPublicCapacityState.TemporarilyUnavailable,
                publicMessage: null,
                "Quick Scan is temporarily unavailable.",
                aiExecutionAllowed: false,
                sampleAvailable: sampleAvailable);
        }

        return Build(
            QuickScanPublicCapacityState.AnonymousLimit,
            publicMessage: null,
            "You have reached the anonymous Quick Scan limit. View the sample result or sign in for more.",
            aiExecutionAllowed: false,
            sampleAvailable: sampleAvailable);
    }

    private static Resolution Build(
        QuickScanPublicCapacityState state,
        string? publicMessage,
        string defaultMessage,
        bool aiExecutionAllowed,
        bool sampleAvailable)
    {
        string message = string.IsNullOrWhiteSpace(publicMessage) ? defaultMessage : publicMessage.Trim();

        return new Resolution(
            state,
            message,
            aiExecutionAllowed,
            sampleAvailable);
    }
}
