using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Exports;

/// <summary>Inputs for the shared career export honesty block (PC-01 measurement floor + CD-15 coverage honesty).</summary>
public sealed record CareerExportCoverageHonestyInput(
    SponsorReviewCoverageHonestyContext CoverageContext,
    int? EnginesSucceeded,
    bool WorkingDesk,
    CareerExportClassificationCounts? ClassificationCounts,
    int CatalogAdvisoryEngineFailureCount = 0,
    bool PreCommitGateEnabled = false,
    StructuralExecutionMode StructuralExecutionMode = StructuralExecutionMode.Simulator,
    bool IsSampleRun = false,
    string? HostAgentExecutionMode = null,
    AgentOutputQualityGateMode HostQualityGateMode = AgentOutputQualityGateMode.WarnOnly,
    AgentOutputQualityGateMode? RecordedQualityGateMode = null,
    AgentOutputQualityGateOutcome? AggregateQualityGateOutcome = null);
