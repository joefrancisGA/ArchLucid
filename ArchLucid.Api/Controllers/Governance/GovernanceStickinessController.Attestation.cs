using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceStickinessController
{
    [HttpGet("realized-value/attestation")]
    [ProducesResponseType(typeof(RealizedValueAttestationResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRealizedValueAttestation(CancellationToken cancellationToken = default)
    {
        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        RealizedValueAttestationResponse response =
            await _facade.GetRealizedValueAttestationAsync(cancellationToken);

        return Ok(response);
    }

    [HttpPut("realized-value/attestation")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [MutatingAuditExcluded("Audit: attestation is stored in TenantSettings; no separate durable audit row in V1.")]
    public async Task<IActionResult> UpsertRealizedValueAttestation(
        [FromBody] UpsertRealizedValueAttestationRequest? request,
        CancellationToken cancellationToken = default)
    {
        IActionResult? bodyProblem =
            GovernanceStickinessControllerCore.ValidateRequestBodyRequired(request).ToBadRequestProblemOrNull(this);

        if (bodyProblem is not null)
            return bodyProblem;

        IActionResult? attestationValidation =
            GovernanceStickinessHttpMapper.ValidateUpsertRealizedValueAttestation(request!)
                .ToBadRequestProblemOrNull(this);

        if (attestationValidation is not null)
            return attestationValidation;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            await _facade.UpsertRealizedValueAttestationAsync(request!, cancellationToken);

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
