namespace ArchLucid.Core.Identity;

public sealed class IdentityAlreadyAttachedToAnotherUserException : Exception
{
    public IdentityAlreadyAttachedToAnotherUserException(ExternalIdentityKey key)
        : base("This sign-in method is already linked to another account.")
    {
        Key = key;
    }

    public ExternalIdentityKey Key
    {
        get;
    }
}

public sealed class RecentAuthenticationRequiredException : Exception
{
    public RecentAuthenticationRequiredException()
        : base("Recent authentication is required for this action. Sign in again and retry.")
    {
    }
}

public sealed class SignInMethodRemovalBlockedException : Exception
{
    public SignInMethodRemovalBlockedException(string message)
        : base(message)
    {
    }
}

public sealed class AuthenticationIdentityLinkProposalNotFoundException : Exception
{
    public AuthenticationIdentityLinkProposalNotFoundException(Guid proposalId)
        : base($"Link proposal '{proposalId:D}' was not found or is no longer available.")
    {
        ProposalId = proposalId;
    }

    public Guid ProposalId
    {
        get;
    }
}

public sealed class AuthenticationIdentityLinkProposalExpiredException : Exception
{
    public AuthenticationIdentityLinkProposalExpiredException(Guid proposalId)
        : base($"Link proposal '{proposalId:D}' has expired.")
    {
        ProposalId = proposalId;
    }

    public Guid ProposalId
    {
        get;
    }
}
