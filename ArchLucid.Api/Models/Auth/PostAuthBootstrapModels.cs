using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Auth;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class PostAuthBootstrapStatusResponse
{
    public string Destination
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<PostAuthBootstrapInvitationResponse> PendingInvitations
    {
        get;
        init;
    } = [];

    public IReadOnlyList<PostAuthBootstrapWorkspaceResponse> Workspaces
    {
        get;
        init;
    } = [];

    public string? ResumePath
    {
        get;
        init;
    }

    public PostAuthBootstrapDuplicateOrganizationResponse? DuplicateOrganization
    {
        get;
        init;
    }

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

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class PostAuthBootstrapInvitationResponse
{
    public Guid InvitationId
    {
        get;
        init;
    }

    public string Label
    {
        get;
        init;
    } = string.Empty;

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

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class PostAuthBootstrapWorkspaceResponse
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

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class PostAuthBootstrapDuplicateOrganizationResponse
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

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class PostAuthCreateWorkspaceBody
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

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class PostAuthCreateWorkspaceResponse
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? CustomerMessage
    {
        get;
        init;
    }

    public string? OnboardingPath
    {
        get;
        init;
    }

    public PostAuthBootstrapSessionResponse? Session
    {
        get;
        init;
    }

    public PostAuthBootstrapDuplicateOrganizationResponse? DuplicateOrganization
    {
        get;
        init;
    }
}

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class PostAuthAcceptInvitationBody
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

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class PostAuthSelectWorkspaceBody
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

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class PostAuthBootstrapSessionResponse
{
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
    } = "/";
}

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class PostAuthAccessRequestBody
{
    public string? Message
    {
        get;
        init;
    }
}
