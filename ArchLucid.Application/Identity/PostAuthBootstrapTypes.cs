namespace ArchLucid.Application.Identity;

public enum PostAuthBootstrapDestination
{
    AcceptInvitation = 0,
    SelectWorkspace = 1,
    ResumeWorkflow = 2,
    CreateWorkspace = 3,
    NoAccess = 4,
    Complete = 5,
}

public sealed class PostAuthBootstrapInvitationSummary
{
    public Guid InvitationId
    {
        get;
        init;
    }

    /// <summary>Neutral label — no private tenant or IdP names.</summary>
    public string Label
    {
        get;
        init;
    } = "Organization workspace";

    public string? MaskedInvitedEmail
    {
        get;
        init;
    }

    public bool RequiresEmailMismatchConfirmation
    {
        get;
        init;
    }

    public string? ConfirmationMessage
    {
        get;
        init;
    }
}

public sealed class PostAuthBootstrapWorkspaceSummary
{
    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public string WorkspaceName
    {
        get;
        init;
    } = string.Empty;
}

public sealed class PostAuthBootstrapDuplicateOrganizationHint
{
    public bool Detected
    {
        get;
        init;
    }

    public bool AccessRequestRecommended
    {
        get;
        init;
    }

    public string CustomerMessage
    {
        get;
        init;
    } = string.Empty;
}

public sealed class PostAuthBootstrapStatusResult
{
    public PostAuthBootstrapDestination Destination
    {
        get;
        init;
    }

    public IReadOnlyList<PostAuthBootstrapInvitationSummary> PendingInvitations
    {
        get;
        init;
    } = [];

    public IReadOnlyList<PostAuthBootstrapWorkspaceSummary> Workspaces
    {
        get;
        init;
    } = [];

    public string? ResumePath
    {
        get;
        init;
    }

    public PostAuthBootstrapDuplicateOrganizationHint DuplicateOrganization
    {
        get;
        init;
    } = new();

    public bool CanCreateWorkspace
    {
        get;
        init;
    }

    public string? DenialReason
    {
        get;
        init;
    }
}

public sealed class PostAuthCreateWorkspaceRequest
{
    public string WorkspaceName
    {
        get;
        init;
    } = string.Empty;

    public string OrganizationName
    {
        get;
        init;
    } = string.Empty;

    public string? DataRegion
    {
        get;
        init;
    }

    public string? IndustryVertical
    {
        get;
        init;
    }

    public string? IndustryVerticalOther
    {
        get;
        init;
    }

    public bool TermsAccepted
    {
        get;
        init;
    }

    public bool IncludeDemoSeed
    {
        get;
        init;
    }

    public string? InvitationToken
    {
        get;
        init;
    }
}

public sealed class PostAuthCreateWorkspaceResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? TenantId
    {
        get;
        init;
    }

    public Guid? WorkspaceId
    {
        get;
        init;
    }

    public Guid? ProjectId
    {
        get;
        init;
    }

    public string? CustomerMessage
    {
        get;
        init;
    }

    public PostAuthBootstrapDuplicateOrganizationHint? DuplicateOrganization
    {
        get;
        init;
    }

    public string OnboardingPath
    {
        get;
        init;
    } = PostAuthOperatorRoutes.BootstrapCompletePath;
}

public sealed class PostAuthSelectWorkspaceRequest
{
    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }
}

public sealed class PostAuthAcceptInvitationRequest
{
    public Guid InvitationId
    {
        get;
        init;
    }

    public string? InvitationToken
    {
        get;
        init;
    }

    public bool ConfirmEmailMismatch
    {
        get;
        init;
    }
}

public sealed class PostAuthBootstrapSessionResult
{
    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public Guid ProjectId
    {
        get;
        init;
    }

    /// <summary>Workspace membership role to embed in the ArchLucid-issued JWT (never elevate beyond membership).</summary>
    public string Role
    {
        get;
        init;
    } = string.Empty;

    public string AccessToken
    {
        get;
        init;
    } = string.Empty;

    public string TokenType
    {
        get;
        init;
    } = "Bearer";

    public int ExpiresInSeconds
    {
        get;
        init;
    }

    public string RedirectPath
    {
        get;
        init;
    } = PostAuthOperatorRoutes.BootstrapCompletePath;
}
