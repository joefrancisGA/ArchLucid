using ArchiForge.Application.Analysis;

namespace ArchiForge.Api.Models;

public sealed class EndToEndReplayComparisonResponse
{
    public EndToEndReplayComparisonReport Report { get; set; } = new();
}

