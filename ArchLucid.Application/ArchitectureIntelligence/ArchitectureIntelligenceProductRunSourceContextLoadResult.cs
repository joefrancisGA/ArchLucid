using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ArchitectureIntelligenceProductRunSourceContextLoadResult
{
    private ArchitectureIntelligenceProductRunSourceContextLoadResult(
        bool found,
        bool hasContent,
        ClosedLoopReasoningRequest? request,
        string? error)
    {
        Found = found;
        HasContent = hasContent;
        Request = request;
        Error = error;
    }

    public bool Found
    {
        get;
    }

    public bool HasContent
    {
        get;
    }

    public ClosedLoopReasoningRequest? Request
    {
        get;
    }

    public string? Error
    {
        get;
    }

    public static ArchitectureIntelligenceProductRunSourceContextLoadResult NotFound(string message) =>
        new(false, false, null, message);

    public static ArchitectureIntelligenceProductRunSourceContextLoadResult Empty(string message) =>
        new(true, false, null, message);

    public static ArchitectureIntelligenceProductRunSourceContextLoadResult Success(
        ClosedLoopReasoningRequest request) =>
        new(true, true, request, null);
}
