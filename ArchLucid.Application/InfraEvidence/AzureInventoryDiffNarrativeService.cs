using ArchLucid.Application;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence;

public sealed class AzureInventoryDiffNarrativeService(
    IAzureInventoryDriftClassificationService driftClassificationService,
    IAzureInventoryDiffNarrativeRepository narrativeRepository,
    IAgentCompletionClient llm,
    IPromptRedactor promptRedactor,
    ILogger<AzureInventoryDiffNarrativeService> logger) : IAzureInventoryDiffNarrativeService
{
    private const string NarrativeSystemPrompt =
        "You are an enterprise cloud architect. Given a structured Azure inventory diff, write a concise 3-5 sentence narrative. "
        + "Cite only the provided changeId values when referencing specific changes. "
        + "Do not invent changes. Return ONLY the narrative prose.";

    public AzureInventoryDiffExecutiveSummaryRecord BuildExecutiveSummary(
        AzureInventoryDiffSummaryRecord summary,
        IReadOnlyList<AzureInventoryClassifiedChangeRecord> classifiedChanges)
        => AzureInventoryDiffNarrativeBuilder.BuildExecutiveSummary(summary, classifiedChanges);

    public async Task<AzureInventoryDiffNarrativeResult> TryBuildNarrativeAsync(
        ScopeContext scope,
        Guid diffId,
        AzureInventoryDiffNarrativeKind narrativeKind,
        bool useSimulator,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        try
        {
            AzureInventoryDriftReportRecord? report =
                await driftClassificationService.TryGetDriftReportAsync(scope, diffId, cancellationToken);

            if (report is null)
            {
                return new AzureInventoryDiffNarrativeResult
                {
                    Succeeded = false,
                    ErrorMessage = "Diff was not found in the current scope.",
                };
            }

            if (report.Summary.TotalChanges <= 0)
            {
                return new AzureInventoryDiffNarrativeResult
                {
                    Succeeded = false,
                    ErrorMessage = "Narrative generation is skipped for empty diffs.",
                };
            }

            IReadOnlyList<Guid> citedChangeIds =
                AzureInventoryDiffNarrativeBuilder.SelectCitedChangeIds(narrativeKind, report.Changes);

            string narrativeText;
            ProvenanceKind provenanceKind;
            string? simulatorLabel = null;

            if (useSimulator)
            {
                narrativeText = AzureInventoryDiffNarrativeBuilder.BuildSimulatorNarrative(
                    narrativeKind,
                    report.Summary,
                    report.Changes,
                    citedChangeIds);

                provenanceKind = ProvenanceKind.DeterministicInference;
                simulatorLabel = AzureInventoryDiffNarrativeBuilder.SimulatorLabel;
            }
            else
            {
                string userPrompt = AzureInventoryDiffNarrativeBuilder.BuildLlmUserPrompt(
                    narrativeKind,
                    report.Summary,
                    report.Changes);

                PromptRedactionOutcome redactedPrompt = promptRedactor.Redact(userPrompt);

                narrativeText = await llm.CompleteJsonAsync(
                    NarrativeSystemPrompt,
                    redactedPrompt.Text,
                    maxTokens: null,
                    cancellationToken: cancellationToken);

                narrativeText = narrativeText.Trim();
                provenanceKind = ProvenanceKind.AiInference;
            }

            if (string.IsNullOrWhiteSpace(narrativeText))
            {
                return new AzureInventoryDiffNarrativeResult
                {
                    Succeeded = false,
                    ErrorMessage = "Narrative generation returned empty text.",
                };
            }

            HashSet<Guid> allowedChangeIds = report.Changes.Select(c => c.Change.ChangeId).ToHashSet();
            IReadOnlyList<Guid> validCitations = citedChangeIds.Where(allowedChangeIds.Contains).ToList();

            DateTime createdUtc = TimeProvider.System.UtcNowDateTime();
            Guid narrativeId = Guid.NewGuid();

            AzureInventoryDiffNarrativeRecord narrative = new()
            {
                NarrativeId = narrativeId,
                DiffId = diffId,
                TenantId = scope.TenantId,
                NarrativeKind = narrativeKind,
                NarrativeText = narrativeText,
                CitedChangeIds = validCitations,
                ProvenanceKind = provenanceKind,
                SimulatorLabel = simulatorLabel,
                CreatedUtc = createdUtc,
            };

            await narrativeRepository.InsertAsync(narrative, cancellationToken);

            return new AzureInventoryDiffNarrativeResult
            {
                Succeeded = true,
                Narrative = narrative,
            };
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (ConflictException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Inventory diff narrative failed for DiffId={DiffId}.", diffId);

            return new AzureInventoryDiffNarrativeResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }
}
