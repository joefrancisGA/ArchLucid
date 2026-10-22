using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Alerts;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Core.Integration;

/// <summary>
///     CG-093 — stamps execute posture on outbound webhook/integration payloads so consumers cannot infer Career from HTTP 200.
/// </summary>
public static class IntegrationEventCareerHonestyPresenter
{
    public static IntegrationEventCareerPostureFields Resolve(
        bool isSampleRun,
        StructuralExecutionMode structuralExecutionMode,
        string? workingCareerRehearsalDoor)
    {
        string door = WorkingCareerRehearsalDoorValues.ParseOrDefault(workingCareerRehearsalDoor);

        bool careerComplete = !isSampleRun
            && !AlertCareerHonestyPresenter.ShouldApplyRehearsalHonesty(
                isSampleRun: false,
                structuralExecutionMode,
                door);

        return new IntegrationEventCareerPostureFields(
            structuralExecutionMode.ToString(),
            door,
            careerComplete);
    }

    public static IntegrationEventCareerPostureFields Resolve(RunRecord run)
    {
        ArgumentNullException.ThrowIfNull(run);

        return Resolve(run.IsSample, run.StructuralExecutionMode, run.WorkingCareerRehearsalDoor);
    }

    public static IntegrationEventCareerPostureFields Resolve(RunSummaryDto runSummary)
    {
        ArgumentNullException.ThrowIfNull(runSummary);

        return Resolve(runSummary.IsSample, runSummary.StructuralExecutionMode, runSummary.WorkingCareerRehearsalDoor);
    }

    public static object ToPayloadProperties(IntegrationEventCareerPostureFields fields)
    {
        ArgumentNullException.ThrowIfNull(fields);

        return new
        {
            structuralExecutionMode = fields.StructuralExecutionMode,
            workingCareerRehearsalDoor = fields.WorkingCareerRehearsalDoor,
            careerComplete = fields.CareerComplete
        };
    }
}
