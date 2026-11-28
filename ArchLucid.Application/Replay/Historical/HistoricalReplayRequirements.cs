namespace ArchLucid.Application.Replay.Historical;

internal static class HistoricalReplayRequirements
{
    internal static (HashSet<string> Required, IReadOnlyList<HistoricalReplayIssue> Issues) Resolve(
        HistoricalReplayDescriptor descriptor, HistoricalReplayMode mode, HistoricalExecutionVersions? compatibleRuntime)
    {
        List<HistoricalReplayIssue> issues = [];
        HashSet<string> required = new(StringComparer.Ordinal);
        bool executesRecordedInput = mode != HistoricalReplayMode.Reconstruction;

        HistoricalRequiredModes flag = mode switch
        {
            HistoricalReplayMode.RecordedRaw => HistoricalRequiredModes.All,
            HistoricalReplayMode.RecordedTyped => HistoricalRequiredModes.Reconstruction | HistoricalRequiredModes.RecordedTyped,
            _ => HistoricalRequiredModes.Reconstruction,
        };

        foreach (var row in descriptor.Artifacts)
        {
            if ((row.AdditionalRequirements & flag) != 0)
                required.Add(row.ArtifactId);
        }

        void Need(string subject, HistoricalArtifactRole role, string? stage = null)
        {
            var matches = descriptor.Artifacts.Where(row => row.Role == role
                && (stage is null ? row.StageId is null : row.StageId == stage)).ToArray();
            if (matches.Length == 0)
                issues.Add(new(subject, "required_binding_missing_" + role));
            else if (matches.Length > 1 && role is (HistoricalArtifactRole.OriginalOutput or HistoricalArtifactRole.EffectivePolicy
                or HistoricalArtifactRole.Configuration or HistoricalArtifactRole.Executable or HistoricalArtifactRole.AcceptedTypedInput
                or HistoricalArtifactRole.AcceptedRawResponse or HistoricalArtifactRole.AcceptedPrompt or HistoricalArtifactRole.ExternalToolResult))
                issues.Add(new(subject, "required_binding_ambiguous_" + role));
            foreach (var item in matches)
                required.Add(item.ArtifactId);
        }

        Need("run", HistoricalArtifactRole.OriginalOutput);
        Need("run", HistoricalArtifactRole.SourceEvidence);
        Need("run", HistoricalArtifactRole.EffectivePolicy);
        Need("run", HistoricalArtifactRole.DecisionTrace);
        if (descriptor.Stages.Count == 0)
            issues.Add(new("run", "stage_lineage_missing"));

        if (executesRecordedInput)
        {
            Need("runtime", HistoricalArtifactRole.Configuration);
            Need("runtime", HistoricalArtifactRole.Executable);
            Need("runtime", HistoricalArtifactRole.RuntimeDependencies);
            if (descriptor.Versions is null || compatibleRuntime != descriptor.Versions)
                issues.Add(new("runtime", "pinned_runtime_missing_or_incompatible"));
            if (descriptor.SourceCoverage != HistoricalCoverage.Complete)
                issues.Add(new("run", "source_coverage_not_complete"));
        }

        foreach (var stage in descriptor.Stages)
        {
            if (stage.Kind != HistoricalStageKind.Deterministic && stage.AcceptedAttempt is null or { ValidationDisposition: HistoricalAttemptDisposition.Unknown })
                issues.Add(new(stage.StageId, "accepted_attempt_not_recorded"));

            if (!executesRecordedInput)
                continue;

            if (stage.Coverage != HistoricalCoverage.Complete)
                issues.Add(new(stage.StageId, "stage_coverage_not_complete"));
            Need(stage.StageId, HistoricalArtifactRole.StageOutput, stage.StageId);
            if (stage.Kind == HistoricalStageKind.ExternalTool)
                Need(stage.StageId, HistoricalArtifactRole.ExternalToolResult, stage.StageId);
            if (stage.Kind == HistoricalStageKind.Model)
            {
                Need(stage.StageId, HistoricalArtifactRole.AcceptedTypedInput, stage.StageId);
                if (mode == HistoricalReplayMode.RecordedRaw)
                {
                    Need(stage.StageId, HistoricalArtifactRole.AcceptedPrompt, stage.StageId);
                    Need(stage.StageId, HistoricalArtifactRole.AcceptedRawResponse, stage.StageId);
                    if (stage.AcceptedAttempt is not { PromptTemplate: not null, PromptTemplateVersion: not null, ParametersSha256: not null })
                        issues.Add(new(stage.StageId, "raw_input_metadata_incomplete"));
                }
            }
        }

        return (required, HistoricalReplayDescriptorValidation.FreezeRows(issues));
    }
}
