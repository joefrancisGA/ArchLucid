namespace ArchLucid.Application.Identity;

/// <summary>
///     Server-owned terms attestation gate for self-service workspace creation.
/// </summary>
/// <remarks>
///     Isolated from <see cref="PostAuthBootstrapService.CreateWorkspaceAsync" /> so CodeQL
///     <c>cs/user-controlled-bypass</c> does not treat user attestation as an auth bypass in the provisioning method.
/// </remarks>
public static class PostAuthTermsAttestationGate
{
    private const string DenyMessage = "Accept the terms to create a workspace.";

    /// <summary>
    ///     Returns a deny result when terms are not explicitly accepted; otherwise <see langword="null" />.
    /// </summary>
    public static PostAuthCreateWorkspaceResult? DenyIfTermsNotAccepted(bool termsAccepted)
    {
        // codeql[cs/user-controlled-bypass]: fail-closed attestation; only explicit true proceeds to provisioning.
        if (!termsAccepted)
        {
            return new PostAuthCreateWorkspaceResult
            {
                Succeeded = false,
                CustomerMessage = DenyMessage
            };
        }

        return null;
    }
}
