using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Architecture;

public enum ArchitectureShareMutationStatus
{
    Success = 0,
    ArchitectureNotFound = 1,
    NotAuthorized = 2,
    ValidationFailed = 3,
}

public sealed class ArchitectureShareMutationResult
{
    public ArchitectureShareMutationStatus Status
    {
        get;
        init;
    }

    public string? ValidationMessage
    {
        get;
        init;
    }

    public ArchitectureShareListResponse? Response
    {
        get;
        init;
    }

    public static ArchitectureShareMutationResult Success(ArchitectureShareListResponse response) =>
        new() { Status = ArchitectureShareMutationStatus.Success, Response = response };

    public static ArchitectureShareMutationResult ArchitectureNotFound() =>
        new() { Status = ArchitectureShareMutationStatus.ArchitectureNotFound };

    public static ArchitectureShareMutationResult NotAuthorized() =>
        new() { Status = ArchitectureShareMutationStatus.NotAuthorized };

    public static ArchitectureShareMutationResult ValidationFailed(string message) =>
        new() { Status = ArchitectureShareMutationStatus.ValidationFailed, ValidationMessage = message };
}
