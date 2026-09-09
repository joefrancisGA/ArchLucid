using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Decisioning.CareerArtifacts;

public enum CareerArtifactKind
{
    Finalize,
    Export,
}

/// <summary>Inputs for ADR 0078 career artifact completeness validation.</summary>
public sealed record CareerArtifactCompletenessInput(
    CareerArtifactKind ArtifactKind,
    TransparencyTrail? TransparencyTrail,
    int? EnginesSucceeded,
    bool WorkingDesk,
    int CatalogAdvisoryEngineFailureCount = 0,
    bool PreCommitGateEnabled = true,
    StructuralExecutionMode StructuralExecutionMode = StructuralExecutionMode.Simulator,
    bool IsSampleRun = false,
    string? HostAgentExecutionMode = null,
    AgentOutputQualityGateMode HostQualityGateMode = AgentOutputQualityGateMode.WarnOnly,
    AgentOutputQualityGateOutcome? AggregateQualityGateOutcome = null,
    bool LegacySealedReExport = false,
    bool BlockExternalSponsorDistribution = false,
    bool SimulatorRehearsalBannerOnArtifact = false,
    FindingsSnapshot? FindingsSnapshot = null,
    bool DegradedFindingCoverage = false,
    IReadOnlyList<string>? DegradedFindingCoverageFailedEngineLabels = null);
