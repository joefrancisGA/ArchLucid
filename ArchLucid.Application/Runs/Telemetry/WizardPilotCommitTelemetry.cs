using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Telemetry;

/// <summary>
///     Records wizard-sourced run wall-clock time from create to first commit (TB-220).
/// </summary>
public static class WizardPilotCommitTelemetry
{
    public const string RequestSourceWizard = "wizard";

    public static bool ShouldRecord(ArchitectureRequest? request)
    {
        if (request is null)
        {
            return false;
        }

        return string.Equals(request.RequestSource, RequestSourceWizard, StringComparison.OrdinalIgnoreCase);
    }

    public static double ComputeElapsedMinutesUtc(DateTime createdUtc, DateTime committedUtc)
    {
        DateTime created = NormalizeUtc(createdUtc);
        DateTime committed = NormalizeUtc(committedUtc);
        double minutes = (committed - created).TotalMinutes;

        if (minutes < 0)
        {
            return 0;
        }

        return minutes;
    }

    public static string NormalizeExecutionMode(StructuralExecutionMode mode) =>
        mode.ToString().ToLowerInvariant();

    public static string NormalizePresetUsed(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return "unknown";
        }

        string normalized = raw.Trim().ToLowerInvariant();

        if (normalized is "greenfield" or "modernize" or "blank")
        {
            return normalized;
        }

        return "unknown";
    }

    public static void RecordIfWizardSourced(ArchitectureRequest request, RunRecord runRecord, DateTime committedUtc)
    {
        if (!ShouldRecord(request))
        {
            return;
        }

        if (runRecord.CreatedUtc == default)
        {
            return;
        }

        double minutes = ComputeElapsedMinutesUtc(runRecord.CreatedUtc, committedUtc);
        string executionMode = NormalizeExecutionMode(runRecord.StructuralExecutionMode);
        string presetUsed = NormalizePresetUsed(request.WizardPresetUsed);
        ArchLucidInstrumentation.RecordWizardToCommittedMinutes(minutes, executionMode, presetUsed);
    }

    private static DateTime NormalizeUtc(DateTime value)
    {
        if (value.Kind == DateTimeKind.Utc)
        {
            return value;
        }

        if (value.Kind == DateTimeKind.Local)
        {
            return value.ToUniversalTime();
        }

        return DateTime.SpecifyKind(value, DateTimeKind.Utc);
    }
}
