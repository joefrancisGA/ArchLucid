using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Canonical paths for string-bearing fields on <see cref="ArchitectureRequest" /> that can reach AI agents,
///     used by the admission precheck and architecture coverage tests.
/// </summary>
internal static class ArchitectureRequestAgentReachableStringPaths
{
    private static readonly string[] Catalog =
    [
        nameof(ArchitectureRequest.RequestId),
        nameof(ArchitectureRequest.Description),
        nameof(ArchitectureRequest.SystemName),
        nameof(ArchitectureRequest.Environment),
        nameof(ArchitectureRequest.QualityAttributeSnapshot),
        nameof(ArchitectureRequest.FailureModeNoteSnapshot),
        nameof(ArchitectureRequest.PriorManifestVersion),
        nameof(ArchitectureRequest.RequestSource),
        nameof(ArchitectureRequest.WizardPresetUsed),
        nameof(ArchitectureRequest.WorkflowIntent),
        nameof(ArchitectureRequest.ModelExecutionProfileOverride),
        nameof(ArchitectureRequest.ModelAliasOverride),
        nameof(ArchitectureRequest.EffectiveModelAliasId),
        nameof(ArchitectureRequest.PriorRunId),
        $"{nameof(ArchitectureRequest.Constraints)}[]",
        $"{nameof(ArchitectureRequest.RequiredCapabilities)}[]",
        $"{nameof(ArchitectureRequest.Assumptions)}[]",
        $"{nameof(ArchitectureRequest.InlineRequirements)}[]",
        $"{nameof(ArchitectureRequest.PolicyReferences)}[]",
        $"{nameof(ArchitectureRequest.TopologyHints)}[]",
        $"{nameof(ArchitectureRequest.SecurityBaselineHints)}[]",
        $"{nameof(ArchitectureRequest.Documents)}[].{nameof(ContextDocumentRequest.Name)}",
        $"{nameof(ArchitectureRequest.Documents)}[].{nameof(ContextDocumentRequest.ContentType)}",
        $"{nameof(ArchitectureRequest.Documents)}[].{nameof(ContextDocumentRequest.Content)}",
        $"{nameof(ArchitectureRequest.Documents)}[].{nameof(ContextDocumentRequest.SourceDocumentUrl)}",
        $"{nameof(ArchitectureRequest.InfrastructureDeclarations)}[].{nameof(InfrastructureDeclarationRequest.Name)}",
        $"{nameof(ArchitectureRequest.InfrastructureDeclarations)}[].{nameof(InfrastructureDeclarationRequest.Format)}",
        $"{nameof(ArchitectureRequest.InfrastructureDeclarations)}[].{nameof(InfrastructureDeclarationRequest.Content)}",
        $"{nameof(ArchitectureRequest.DraftActors)}[].{nameof(ActorDescriptor.Label)}",
        $"{nameof(ArchitectureRequest.IntakeTransparencyTrail)}.{nameof(TransparencyTrail.Asserted)}[].{nameof(AssertedTrailEntry.Key)}",
        $"{nameof(ArchitectureRequest.IntakeTransparencyTrail)}.{nameof(TransparencyTrail.Asserted)}[].{nameof(AssertedTrailEntry.Value)}",
        $"{nameof(ArchitectureRequest.IntakeTransparencyTrail)}.{nameof(TransparencyTrail.Asserted)}[].{nameof(AssertedTrailEntry.QuestionId)}",
        $"{nameof(ArchitectureRequest.IntakeTransparencyTrail)}.{nameof(TransparencyTrail.Asserted)}[].{nameof(AssertedTrailEntry.ResponderLabel)}",
        $"{nameof(ArchitectureRequest.IntakeTransparencyTrail)}.{nameof(TransparencyTrail.Inferred)}[].{nameof(InferredTrailEntry.Key)}",
        $"{nameof(ArchitectureRequest.IntakeTransparencyTrail)}.{nameof(TransparencyTrail.Inferred)}[].{nameof(InferredTrailEntry.Value)}",
        $"{nameof(ArchitectureRequest.IntakeTransparencyTrail)}.{nameof(TransparencyTrail.Skipped)}[].{nameof(SkippedQuestionTrailEntry.QuestionKey)}",
        $"{nameof(ArchitectureRequest.IntakeQuestionAnswers)}[].Key",
        $"{nameof(ArchitectureRequest.IntakeQuestionAnswers)}[].Value",
    ];

    internal static IReadOnlyList<string> Enumerate() => Catalog;

    internal static void ScanAll(ArchitectureRequest request, List<string> reasons)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(reasons);

        foreach (string path in Catalog)
        {
            if (ArchitectureRequestContentSafetyScanExemptions.IsExempt(path))
                continue;

            foreach (string? value in ReadStringValues(request, path))
            {
                PromptInjectionPatternSignals.AccumulateForField(value, ScanLabel(path), reasons);
            }
        }
    }

    internal static string ScanLabel(string path) => path;

    internal static IEnumerable<string?> ReadStringValues(ArchitectureRequest request, string path)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(path);

        if (path is $"{nameof(ArchitectureRequest.IntakeQuestionAnswers)}[].Key")
        {
            foreach (string key in request.IntakeQuestionAnswers.Keys)
                yield return key;

            yield break;
        }

        if (path is $"{nameof(ArchitectureRequest.IntakeQuestionAnswers)}[].Value")
        {
            foreach (string value in request.IntakeQuestionAnswers.Values)
                yield return value;

            yield break;
        }

        if (!path.Contains('[', StringComparison.Ordinal))
        {
            yield return ReadScalarString(request, path);

            yield break;
        }

        string[] segments = path.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        object? current = request;

        for (int index = 0; index < segments.Length; index++)
        {
            string segment = segments[index];
            bool isCollection = segment.EndsWith("[]", StringComparison.Ordinal);
            string propertyName = isCollection ? segment[..^2] : segment;

            if (current is null)
                yield break;

            if (isCollection)
            {
                object? collection = current.GetType().GetProperty(propertyName)?.GetValue(current);

                if (collection is not System.Collections.IEnumerable enumerable)
                    yield break;

                string remainder = string.Join('.', segments[(index + 1)..]);

                foreach (object? element in enumerable)
                {
                    if (element is null)
                        continue;

                    if (remainder.Length == 0)
                    {
                        if (element is string directString)
                            yield return directString;

                        yield break;
                    }

                    if (remainder.Contains('[', StringComparison.Ordinal))
                    {
                        foreach (string? nested in ReadNestedCollectionElementStrings(element, remainder))
                            yield return nested;
                    }
                    else
                    {
                        yield return ReadScalarString(element, remainder);
                    }
                }

                yield break;
            }

            current = current.GetType().GetProperty(propertyName)?.GetValue(current);
        }
    }

    private static IEnumerable<string?> ReadNestedCollectionElementStrings(object element, string remainder)
    {
        string[] segments = remainder.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        object? current = element;

        for (int index = 0; index < segments.Length; index++)
        {
            string segment = segments[index];
            bool isCollection = segment.EndsWith("[]", StringComparison.Ordinal);
            string propertyName = isCollection ? segment[..^2] : segment;

            if (current is null)
                yield break;

            if (isCollection)
            {
                object? collection = current.GetType().GetProperty(propertyName)?.GetValue(current);

                if (collection is not System.Collections.IEnumerable enumerable)
                    yield break;

                string tail = string.Join('.', segments[(index + 1)..]);

                foreach (object? child in enumerable)
                {
                    if (child is null)
                        continue;

                    if (tail.Length == 0)
                        yield break;

                    yield return ReadScalarString(child, tail);
                }

                yield break;
            }

            current = current.GetType().GetProperty(propertyName)?.GetValue(current);
        }
    }

    private static string? ReadScalarString(object target, string propertyName)
    {
        return target.GetType().GetProperty(propertyName)?.GetValue(target) as string;
    }
}
