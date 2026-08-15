using ArchLucid.Api.Contracts;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;

namespace ArchLucid.Api.Models.Runs;

/// <summary>Run detail below-fold timelines: pipeline audit trail and stage outcomes.</summary>
public sealed class RunDetailTimelinesBundleResponse
{
    public IReadOnlyList<RunPipelineTimelineItemResponse> PipelineTimeline
    {
        get;
        init;
    } = [];

    public IReadOnlyList<StageTimelineSummary> StageTimeline
    {
        get;
        init;
    } = [];
}
