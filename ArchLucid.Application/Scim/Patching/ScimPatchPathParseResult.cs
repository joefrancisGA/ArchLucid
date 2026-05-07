namespace ArchLucid.Application.Scim.Patching;
/// <summary>Outcome of interpreting a PATCH <c>path</c> string (RFC 7644 §3.5.2 <c>valuePath</c> subset).</summary>
public abstract record ScimPatchPathParseOutcome;
/// <summary>Unfiltered attribute path (<c>userName</c>, <c>members</c>, etc.).</summary>
public sealed record ScimPatchFlatAttributePathOutcome : ScimPatchPathParseOutcome
{
    public string AttributePath { get; init; }

    public ScimPatchFlatAttributePathOutcome(string attributePath)
    {
        AttributePath = attributePath ?? throw new ArgumentNullException(nameof(attributePath));
    }
}

/// <summary><c>members[value eq "..."]</c> optionally followed by <c>.subAttr</c> (<c>active</c> only).</summary>
public sealed record ScimPatchMembersFilteredPathOutcome(Guid ReferenceUserId, string? SubAttribute) : ScimPatchPathParseOutcome
{
}

/// <summary>Bracketed attribute path ArchLucid does not implement (valid-looking SCIM grammar subset).</summary>
public sealed record ScimPatchPathNotImplementedOutcome : ScimPatchPathParseOutcome
{
    public string Detail { get; init; }

    public ScimPatchPathNotImplementedOutcome(string detail)
    {
        Detail = detail ?? throw new ArgumentNullException(nameof(detail));
    }
}

/// <summary>Path is not valid for group membership PATCH (<c>invalidPath</c>).</summary>
public sealed record ScimPatchPathInvalidOutcome : ScimPatchPathParseOutcome
{
    public string Detail { get; init; }

    public ScimPatchPathInvalidOutcome(string detail)
    {
        Detail = detail ?? throw new ArgumentNullException(nameof(detail));
    }
}