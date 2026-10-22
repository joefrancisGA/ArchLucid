using ArchLucid.Application.Architecture;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Drafts;

/// <summary>Resolves the spawned run id from unified create-run command results.</summary>
internal static class DraftSubmitRunCreateResolver
{
    internal static string ResolveRunId(CreateRunCommandResult commandResult)
    {
        ArgumentNullException.ThrowIfNull(commandResult);

        if (commandResult.IsSynthesisPath)
        {
            ArchitectureSynthesisGenerateResult? synthesis = commandResult.SynthesisResult;

            if (synthesis is null || string.IsNullOrWhiteSpace(synthesis.RunId))
                throw new InvalidOperationException("Synthesis create path returned no run id.");

            return synthesis.RunId;
        }

        CreateRunResult? standard = commandResult.StandardResult;

        if (standard?.Run is null || string.IsNullOrWhiteSpace(standard.Run.RunId))
            throw new InvalidOperationException("Review create path returned no run id.");

        return standard.Run.RunId;
    }
}
