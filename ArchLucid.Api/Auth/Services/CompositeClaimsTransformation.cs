using System.Security.Claims;

using Microsoft.AspNetCore.Authentication;

namespace ArchLucid.Api.Auth.Services;

/// <summary>Runs multiple <see cref="IClaimsTransformation" /> implementations in registration order.</summary>
public sealed class CompositeClaimsTransformation(IEnumerable<IClaimsTransformation> transformations) : IClaimsTransformation
{
    private readonly IReadOnlyList<IClaimsTransformation> _transformations =
        transformations?.ToList() ?? throw new ArgumentNullException(nameof(transformations));

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        ClaimsPrincipal current = principal;

        foreach (IClaimsTransformation transformation in _transformations)
            current = await transformation.TransformAsync(current).ConfigureAwait(false);

        return current;
    }
}
