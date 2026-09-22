using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.User;
using ArchLucid.Decisioning.CareerArtifacts;

namespace ArchLucid.Application.Exports;

/// <summary>Maps career export honesty loader inputs to ADR 0078 validator inputs (FC-03).</summary>
public static class CareerArtifactCompletenessInputMapper
{
    public static CareerArtifactCompletenessInput MapForExport(
        CareerExportCoverageHonestyInput input,
        TransparencyTrail? transparencyTrail,
        bool blockExternalSponsorDistribution = false,
        bool legacySealedReExport = false)
    {
        ArgumentNullException.ThrowIfNull(input);

        bool resolvedLegacySealedReExport =
            legacySealedReExport || LegacySealedReExportHonestyResolver.Resolve(transparencyTrail);
        bool simulatorRehearsalBannerOnArtifact = ResolveSimulatorRehearsalBannerOnArtifactForExport(input);

        return new CareerArtifactCompletenessInput(
            ArtifactKind: CareerArtifactKind.Export,
            TransparencyTrail: transparencyTrail,
            EnginesSucceeded: input.EnginesSucceeded,
            WorkingDesk: input.WorkingDesk,
            CatalogAdvisoryEngineFailureCount: input.CatalogAdvisoryEngineFailureCount,
            PreCommitGateEnabled: input.PreCommitGateEnabled,
            StructuralExecutionMode: input.StructuralExecutionMode,
            IsSampleRun: input.IsSampleRun,
            HostAgentExecutionMode: input.HostAgentExecutionMode,
            HostQualityGateMode: input.HostQualityGateMode,
            AggregateQualityGateOutcome: input.AggregateQualityGateOutcome,
            LegacySealedReExport: resolvedLegacySealedReExport,
            BlockExternalSponsorDistribution: blockExternalSponsorDistribution,
            SimulatorRehearsalBannerOnArtifact: simulatorRehearsalBannerOnArtifact,
            WorkingCareerRehearsalDoor: input.WorkingCareerRehearsalDoor,
            FindingsSnapshot: input.FindingsSnapshot,
            FeasibilityVerdict: input.CoverageContext.Verdict);
    }

    internal static bool ResolveSimulatorRehearsalBannerOnArtifactForExport(CareerExportCoverageHonestyInput input)
    {
        ArgumentNullException.ThrowIfNull(input);

        if (!SimulatorCareerHonestyPresenter.IsRehearsalStructuralExecutionMode(input.StructuralExecutionMode))
        {
            return false;
        }

        return WorkingCareerRehearsalDoorValues.ParseOrDefault(input.WorkingCareerRehearsalDoor)
            == WorkingCareerRehearsalDoorValues.Rehearsal;
    }

    public static CareerArtifactCompletenessInput MapForFinalize(
        TransparencyTrail? transparencyTrail,
        int? enginesSucceeded,
        bool workingDesk,
        bool preCommitGateEnabled,
        StructuralExecutionMode structuralExecutionMode = StructuralExecutionMode.Simulator,
        bool degradedFindingCoverage = false,
        IReadOnlyList<string>? degradedFindingCoverageFailedEngineLabels = null,
        string? workingCareerRehearsalDoor = null)
    {
        return new CareerArtifactCompletenessInput(
            ArtifactKind: CareerArtifactKind.Finalize,
            TransparencyTrail: transparencyTrail,
            EnginesSucceeded: enginesSucceeded,
            WorkingDesk: workingDesk,
            PreCommitGateEnabled: preCommitGateEnabled,
            StructuralExecutionMode: structuralExecutionMode,
            DegradedFindingCoverage: degradedFindingCoverage,
            DegradedFindingCoverageFailedEngineLabels: degradedFindingCoverageFailedEngineLabels,
            WorkingCareerRehearsalDoor: workingCareerRehearsalDoor);
    }
}
