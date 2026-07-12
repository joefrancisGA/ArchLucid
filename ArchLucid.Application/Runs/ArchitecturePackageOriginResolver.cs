using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Resolves persisted <see cref="ArchitecturePackageOrigin" /> from intake metadata at run create.
/// </summary>
public static class ArchitecturePackageOriginResolver
{
    public static string Resolve(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.Equals(request.WorkflowIntent, ArchitectureWorkflowIntent.CreateArchitecture, StringComparison.OrdinalIgnoreCase))
            return ArchitecturePackageOrigin.Created;

        if (string.Equals(request.WorkflowIntent, ArchitectureWorkflowIntent.StartReview, StringComparison.OrdinalIgnoreCase))
            return ArchitecturePackageOrigin.Reviewed;

        if (string.Equals(request.RequestSource, "wizard", StringComparison.OrdinalIgnoreCase))
            return ArchitecturePackageOrigin.Reviewed;

        if (string.Equals(request.RequestSource, "recurrence", StringComparison.OrdinalIgnoreCase))
            return ArchitecturePackageOrigin.Reviewed;

        if (string.Equals(request.RequestSource, "cli", StringComparison.OrdinalIgnoreCase))
            return ArchitecturePackageOrigin.Reviewed;

        return ArchitecturePackageOrigin.Reviewed;
    }
}
