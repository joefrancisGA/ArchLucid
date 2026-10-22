using ArchLucid.Api.Http.Governance;
using ArchLucid.Contracts.Governance;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceController
{
    [HttpGet("schema-keys")]
    [OutputCache(PolicyName = "ImmutableShort")]
    [ProducesResponseType(typeof(PolicyPackSchemaKeysResponse), StatusCodes.Status200OK)]
    public IActionResult GetPolicyPackSchemaKeys()
    {
        PolicyPackSchemaKeysResponse response = _policyPackSchemaKeysService.GetSchemaKeys();
        return Ok(response);
    }

    /// <summary>
    ///     Returns the registered <c>PolicyPackContentDocument</c> JSON Schema for real-time policy pack editor validation.
    /// </summary>
    [HttpGet("policy-pack-content-schema")]
    [OutputCache(PolicyName = "ImmutableShort")]
    [ProducesResponseType(typeof(PolicyPackContentDocumentJsonSchemaResponse), StatusCodes.Status200OK)]
    public IActionResult GetPolicyPackContentDocumentJsonSchema()
    {
        PolicyPackContentDocumentJsonSchemaResponse response =
            _policyPackSchemaKeysService.GetContentDocumentJsonSchema();

        return Ok(response);
    }
}
