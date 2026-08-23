using ArchLucid.Application.Architecture;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Unified outcome for create-run whether routed through synthesis or the review create orchestrator.
/// </summary>
public sealed class CreateRunCommandResult
{
    /// <summary>Populated when the request uses the standard review create path.</summary>
    public CreateRunResult? StandardResult
    {
        get;
        init;
    }

    /// <summary>Populated when <see cref="ArchitectureWorkflowIntent.CreateArchitecture" /> routes through synthesis.</summary>
    public ArchitectureSynthesisGenerateResult? SynthesisResult
    {
        get;
        init;
    }

    /// <summary><see langword="true" /> when <see cref="SynthesisResult" /> is set.</summary>
    public bool IsSynthesisPath => SynthesisResult is not null;
}
