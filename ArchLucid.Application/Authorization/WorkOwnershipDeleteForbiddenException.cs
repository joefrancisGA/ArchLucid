namespace ArchLucid.Application.Authorization;

/// <summary>Thrown when a non-admin caller attempts to delete or archive work they do not own while tenant policy requires ownership.</summary>
public sealed class WorkOwnershipDeleteForbiddenException : Exception
{
    public WorkOwnershipDeleteForbiddenException()
        : base("Only the creator or a workspace administrator may delete or archive this item.")
    {
    }

    public WorkOwnershipDeleteForbiddenException(string message)
        : base(message)
    {
    }
}
