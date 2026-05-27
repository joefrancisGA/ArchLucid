using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Ensures <see cref="AgentOutputQualityGateOptions" /> is coherent when options validation runs at host startup.
/// </summary>
public sealed class AgentOutputQualityGateOptionsValidator : IValidateOptions<AgentOutputQualityGateOptions>
{
    /// <inheritdoc />
    public ValidateOptionsResult Validate(string? name, AgentOutputQualityGateOptions options)
    {
        if (options is null) throw new ArgumentNullException(nameof(options));

        if (options is { Mode: AgentOutputQualityGateMode.PilotStrict, PilotStrictMinAgentResultFaithfulnessSupportRatio: null })
        {
            return ValidateOptionsResult.Fail(
                $"{AgentOutputQualityGateOptions.SectionPath}: {nameof(AgentOutputQualityGateOptions.Mode)} "
                + $"{nameof(AgentOutputQualityGateMode.PilotStrict)} requires a non-null "
                + $"{nameof(AgentOutputQualityGateOptions.PilotStrictMinAgentResultFaithfulnessSupportRatio)} "
                + "(mandatory faithfulness floor for AgentResult→evidence grounding).");
        }

        if (options is { Mode: AgentOutputQualityGateMode.PilotStrict, PilotStrictMinFaithfulnessSupportRatio: null or <= 0 })
        {
            return ValidateOptionsResult.Fail(
                $"{AgentOutputQualityGateOptions.SectionPath}: {nameof(AgentOutputQualityGateOptions.Mode)} "
                + $"{nameof(AgentOutputQualityGateMode.PilotStrict)} requires a positive "
                + $"{nameof(AgentOutputQualityGateOptions.PilotStrictMinFaithfulnessSupportRatio)} "
                + "(aggregate explanation faithfulness floor).");
        }

        if (options is { Mode: AgentOutputQualityGateMode.PilotStrict, PilotStrictMinEvidenceRefCount: <= 0 })
        {
            return ValidateOptionsResult.Fail(
                $"{AgentOutputQualityGateOptions.SectionPath}: {nameof(AgentOutputQualityGateOptions.Mode)} "
                + $"{nameof(AgentOutputQualityGateMode.PilotStrict)} requires "
                + $"{nameof(AgentOutputQualityGateOptions.PilotStrictMinEvidenceRefCount)} > 0.");
        }

        return ValidateOptionsResult.Success;
    }
}
