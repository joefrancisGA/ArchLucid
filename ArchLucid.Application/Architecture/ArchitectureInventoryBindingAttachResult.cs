using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Architecture;

public sealed class ArchitectureInventoryBindingAttachResult
{
    public ArchitectureInventoryBindingAttachStatus Status
    {
        get;
        init;
    }

    public ArchitectureInventoryBindingResponse? Response
    {
        get;
        init;
    }

    public static ArchitectureInventoryBindingAttachResult ArchitectureNotFound() =>
        new() { Status = ArchitectureInventoryBindingAttachStatus.ArchitectureNotFound };

    public static ArchitectureInventoryBindingAttachResult SnapshotNotFound() =>
        new() { Status = ArchitectureInventoryBindingAttachStatus.SnapshotNotFound };

    public static ArchitectureInventoryBindingAttachResult Success(ArchitectureInventoryBindingResponse response) =>
        new()
        {
            Status = ArchitectureInventoryBindingAttachStatus.Success,
            Response = response,
        };
}
