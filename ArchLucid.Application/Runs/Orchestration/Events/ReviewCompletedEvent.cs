namespace ArchLucid.Application.Runs.Orchestration.Events;

public class ReviewCompletedEvent
{
    public string RunId { get; set; } = null!;
    public string ProjectId { get; set; } = null!;
}