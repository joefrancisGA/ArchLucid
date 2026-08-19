namespace ArchLucid.Application.Identity;

public sealed class WorkspacePackagingLimitEvaluation
{
    public bool Allowed
    {
        get;
        init;
    }

    public string? CustomerMessage
    {
        get;
        init;
    }

    public string? DenyReasonCode
    {
        get;
        init;
    }

    public static WorkspacePackagingLimitEvaluation Allow() =>
        new() { Allowed = true };

    public static WorkspacePackagingLimitEvaluation Deny(string customerMessage, string denyReasonCode) =>
        new()
        {
            Allowed = false,
            CustomerMessage = customerMessage,
            DenyReasonCode = denyReasonCode
        };
}
