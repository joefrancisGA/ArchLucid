namespace ArchLucid.Application.Runs.Orchestration;

public sealed class RequestContentSafetyResult
{
    public bool IsAllowed
    {
        get;
        init;
    }

    public IReadOnlyList<string> Reasons
    {
        get;
        init;
    } = [];
}
