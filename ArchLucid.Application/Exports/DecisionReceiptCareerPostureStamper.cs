using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.User;
using ArchLucid.Decisioning.CareerArtifacts;

namespace ArchLucid.Application.Exports;

/// <summary>
///     CG-025 — stamps execute posture on committed-run decision receipts after sealed-hash verification.
///     Posture fields are export overlays; they are not part of <see cref="DecisionReceiptCanonicalHasher" />.
/// </summary>
public static class DecisionReceiptCareerPostureStamper
{
    public static void ApplyCommittedRunPosture(
        DecisionReceiptDocument receipt,
        CareerExportCoverageHonestyInput honesty)
    {
        ArgumentNullException.ThrowIfNull(receipt);
        ArgumentNullException.ThrowIfNull(honesty);

        if (receipt.Source != DecisionReceiptSource.CommittedRun)
        {
            return;
        }

        string door = WorkingCareerRehearsalDoorValues.ParseOrDefault(honesty.WorkingCareerRehearsalDoor);
        bool rehearsalIncomplete = ResolveRehearsalIncomplete(honesty.StructuralExecutionMode, door);

        receipt.StructuralExecutionMode = honesty.StructuralExecutionMode;
        receipt.WorkingCareerRehearsalDoor = door;
        receipt.RehearsalIncomplete = rehearsalIncomplete;
    }

    internal static bool ResolveRehearsalIncomplete(
        StructuralExecutionMode structuralExecutionMode,
        string workingCareerRehearsalDoor)
    {
        if (!SimulatorCareerHonestyPresenter.IsRehearsalStructuralExecutionMode(structuralExecutionMode))
        {
            return false;
        }

        return workingCareerRehearsalDoor == WorkingCareerRehearsalDoorValues.Rehearsal;
    }
}
