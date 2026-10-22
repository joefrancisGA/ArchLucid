namespace ArchLucid.Application.Architecture;

public sealed class ArchitectureShareDeleteResult
{
    public ArchitectureShareDeleteStatus Status
    {
        get;
        init;
    }

    public static ArchitectureShareDeleteResult ArchitectureNotFound() =>
        new() { Status = ArchitectureShareDeleteStatus.ArchitectureNotFound };

    public static ArchitectureShareDeleteResult ShareNotFound() =>
        new() { Status = ArchitectureShareDeleteStatus.ShareNotFound };

    public static ArchitectureShareDeleteResult Success() =>
        new() { Status = ArchitectureShareDeleteStatus.Success };
}

public enum ArchitectureShareDeleteStatus
{
    Success,
    ArchitectureNotFound,
    ShareNotFound,
}
