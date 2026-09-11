using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Alerts;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>CG-038 — ITSM ticket summary/description honesty when the finding run is not Career + Real.</summary>
public static class ItsmOutboundCareerHonestyPresenter
{
    public const string RehearsalSummaryPrefix = "[Rehearsal] ";

    public const string DescriptionHeader = "Rehearsal honesty:";

    public const string CareerBlockedRowLabel = "Career blocked";

    public const string RehearsalIncompleteRowLabel = "Rehearsal incomplete";

    public const string PracticeRowLabel = "Practice";

    public static ItsmOutboundCareerHonestyStamp Resolve(RunSummaryDto runSummary)
    {
        ArgumentNullException.ThrowIfNull(runSummary);

        if (!AlertCareerHonestyPresenter.ShouldApplyRehearsalHonesty(runSummary))
        {
            return ItsmOutboundCareerHonestyStamp.CareerReal;
        }

        string effectiveDoor = WorkingCareerRehearsalDoorValues.ParseOrDefault(runSummary.WorkingCareerRehearsalDoor);
        string rehearsalLabel = ResolveRehearsalLabel(runSummary);

        return new ItsmOutboundCareerHonestyStamp(
            RequiresHonesty: true,
            IncludeCareerCompleteCustomField: false,
            RehearsalLabel: rehearsalLabel,
            StructuralExecutionMode: runSummary.StructuralExecutionMode.ToString(),
            WorkingCareerRehearsalDoor: effectiveDoor);
    }

    public static (string Summary, string Description) Apply(
        string summary,
        string description,
        ItsmOutboundCareerHonestyStamp stamp)
    {
        ArgumentNullException.ThrowIfNull(summary);
        ArgumentNullException.ThrowIfNull(description);
        ArgumentNullException.ThrowIfNull(stamp);

        if (!stamp.RequiresHonesty)
        {
            return (summary, description);
        }

        string stampedSummary = summary.StartsWith(RehearsalSummaryPrefix, StringComparison.Ordinal)
            ? summary
            : RehearsalSummaryPrefix + summary;

        if (description.Contains(DescriptionHeader, StringComparison.Ordinal))
        {
            return (stampedSummary, description);
        }

        string honestyBlock =
            $"{DescriptionHeader}{Environment.NewLine}" +
            $"- structuralExecutionMode: {stamp.StructuralExecutionMode}{Environment.NewLine}" +
            $"- workingCareerRehearsalDoor: {stamp.WorkingCareerRehearsalDoor}{Environment.NewLine}" +
            $"- rehearsalLabel: {stamp.RehearsalLabel}";

        return (stampedSummary, honestyBlock + Environment.NewLine + Environment.NewLine + description);
    }

    private static string ResolveRehearsalLabel(RunSummaryDto runSummary)
    {
        string effectiveDoor = WorkingCareerRehearsalDoorValues.ParseOrDefault(runSummary.WorkingCareerRehearsalDoor);

        if (effectiveDoor == WorkingCareerRehearsalDoorValues.Career)
        {
            return CareerBlockedRowLabel;
        }

        if (AlertCareerHonestyPresenter.IsRehearsalStructuralExecutionMode(runSummary.StructuralExecutionMode))
        {
            return RehearsalIncompleteRowLabel;
        }

        return PracticeRowLabel;
    }
}

/// <summary>Career honesty stamp applied to outbound ITSM ticket fields.</summary>
public sealed record ItsmOutboundCareerHonestyStamp(
    bool RequiresHonesty,
    bool IncludeCareerCompleteCustomField,
    string? RehearsalLabel,
    string StructuralExecutionMode,
    string WorkingCareerRehearsalDoor)
{
    public static ItsmOutboundCareerHonestyStamp CareerReal { get; } = new(
        false,
        true,
        null,
        Contracts.Common.StructuralExecutionMode.Real.ToString(),
        WorkingCareerRehearsalDoorValues.Career);
}
