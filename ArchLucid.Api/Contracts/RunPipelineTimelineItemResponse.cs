using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Contracts;

/// <summary>JSON contract for one row in <c>GET /v1/authority/runs/{{runId}}/pipeline-timeline</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "API contract DTO; no business logic.")]
public sealed class RunPipelineTimelineItemResponse
{
    public Guid EventId { get; set; }

    public DateTime OccurredUtc { get; set; }

    public string EventType { get; set; } = null!;

    public string ActorUserName { get; set; } = null!;

    public string? CorrelationId { get; set; }
}
