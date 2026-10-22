using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Architecture;

public sealed class ArchitectureShareListResult
{
    public ArchitectureShareListStatus Status
    {
        get;
        init;
    }

    public ArchitectureShareListResponse? Response
    {
        get;
        init;
    }

    public static ArchitectureShareListResult ArchitectureNotFound() =>
        new() { Status = ArchitectureShareListStatus.ArchitectureNotFound };

    public static ArchitectureShareListResult Success(ArchitectureShareListResponse response) =>
        new() { Status = ArchitectureShareListStatus.Success, Response = response };
}

public enum ArchitectureShareListStatus
{
    Success,
    ArchitectureNotFound,
}
