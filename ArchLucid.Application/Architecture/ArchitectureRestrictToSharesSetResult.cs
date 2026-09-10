using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Architecture;

public sealed class ArchitectureRestrictToSharesSetResult
{
    public ArchitectureRestrictToSharesSetStatus Status
    {
        get;
        init;
    }

    public ArchitectureRestrictToSharesResponse? Response
    {
        get;
        init;
    }

    public static ArchitectureRestrictToSharesSetResult Success(ArchitectureRestrictToSharesResponse response) =>
        new()
        {
            Status = ArchitectureRestrictToSharesSetStatus.Success,
            Response = response,
        };

    public static ArchitectureRestrictToSharesSetResult ArchitectureNotFound() =>
        new() { Status = ArchitectureRestrictToSharesSetStatus.ArchitectureNotFound };

    public static ArchitectureRestrictToSharesSetResult ConfirmationRequired() =>
        new() { Status = ArchitectureRestrictToSharesSetStatus.ConfirmationRequired };

    public static ArchitectureRestrictToSharesSetResult ActorUserRequired() =>
        new() { Status = ArchitectureRestrictToSharesSetStatus.ActorUserRequired };
}
