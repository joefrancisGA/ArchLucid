namespace ArchLucid.Application.Pilots;
/// <summary>Inputs for the first-value report execution provenance footer (pilot try --real path).</summary>
public sealed record ExecutionProvenanceFooterInput(bool RealModeFellBackToSimulator, string? PilotAoaiDeploymentSnapshot, string HostAgentExecutionMode, string? HostAzureOpenAiDeploymentName, int LlmCompletionTraceCount)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(PilotAoaiDeploymentSnapshot, HostAgentExecutionMode, HostAzureOpenAiDeploymentName);
    private static byte __ValidatePrimaryConstructorArguments(System.String? pilotAoaiDeploymentSnapshot, System.String hostAgentExecutionMode, System.String? hostAzureOpenAiDeploymentName)
    {
        ArgumentNullException.ThrowIfNull(hostAgentExecutionMode);
        return (byte)0;
    }
}