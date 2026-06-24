using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Validates custom <see cref="PolicyPackContentDocument" /> JSON for authoring (schema hygiene + rule-key warnings).
/// </summary>
public interface IPolicyPackContentAuthoringValidationService
{
    /// <summary>
    ///     Validates structural rules and emits warnings for unknown <c>complianceRuleKeys</c>.
    /// </summary>
    Task<PolicyPackContentValidationResponse> ValidateAsync(
        PolicyPackContentDocument document,
        CancellationToken cancellationToken);
}
