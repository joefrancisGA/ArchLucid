namespace ArchLucid.Application.Architecture;

public sealed class ArchitectureShareUpsertResult
{
    public ArchitectureShareUpsertStatus Status
    {
        get;
        init;
    }

    public static ArchitectureShareUpsertResult ArchitectureNotFound() =>
        new() { Status = ArchitectureShareUpsertStatus.ArchitectureNotFound };

    public static ArchitectureShareUpsertResult InvalidRole() =>
        new() { Status = ArchitectureShareUpsertStatus.InvalidRole };

    public static ArchitectureShareUpsertResult ScimGroupNotSupported() =>
        new() { Status = ArchitectureShareUpsertStatus.ScimGroupNotSupported };

    public static ArchitectureShareUpsertResult UserNotFound() =>
        new() { Status = ArchitectureShareUpsertStatus.UserNotFound };

    public static ArchitectureShareUpsertResult Success() =>
        new() { Status = ArchitectureShareUpsertStatus.Success };
}

public enum ArchitectureShareUpsertStatus
{
    Success,
    ArchitectureNotFound,
    InvalidRole,
    ScimGroupNotSupported,
    UserNotFound,
}
