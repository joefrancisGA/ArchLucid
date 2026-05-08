using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm.Redaction;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Evidence;

/// <inheritdoc cref="IEvidencePackageInjectionMitigator" />
public sealed class EvidencePackageInjectionMitigator(
    IOptionsMonitor<EvidenceInjectionMitigationOptions> options,
    IOptionsMonitor<LlmPromptRedactionOptions> redactionOptions,
    IPromptRedactor promptRedactor,
    ILogger<EvidencePackageInjectionMitigator> logger) : IEvidencePackageInjectionMitigator
{
    private readonly IOptionsMonitor<EvidenceInjectionMitigationOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly IOptionsMonitor<LlmPromptRedactionOptions> _redactionOptions =
        redactionOptions ?? throw new ArgumentNullException(nameof(redactionOptions));

    private readonly IPromptRedactor _promptRedactor =
        promptRedactor ?? throw new ArgumentNullException(nameof(promptRedactor));

    private readonly ILogger<EvidencePackageInjectionMitigator> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public Task<int> RedactKnownInjectionPatternsAsync(AgentEvidencePackage evidence, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(evidence);
        cancellationToken.ThrowIfCancellationRequested();

        EvidenceInjectionMitigationOptions opts = _options.CurrentValue;

        if (!opts.Enabled)
            return Task.FromResult(0);

        int changed = 0;
        string marker = string.IsNullOrWhiteSpace(opts.RedactedMarker) ? "[redacted-prompt-injection]" : opts.RedactedMarker.Trim();

        changed += SanitizeScalar(evidence.Request.Description, v => evidence.Request.Description = v, marker);
        changed += SanitizeList(evidence.Request.Constraints, marker);
        changed += SanitizeList(evidence.Request.RequiredCapabilities, marker);
        changed += SanitizeList(evidence.Request.Assumptions, marker);

        foreach (PolicyEvidence policy in evidence.Policies)
        {
            changed += SanitizeScalar(policy.PolicyId, v => policy.PolicyId = v, marker);
            changed += SanitizeScalar(policy.Title, v => policy.Title = v, marker);
            changed += SanitizeScalar(policy.Summary, v => policy.Summary = v, marker);
            changed += SanitizeList(policy.RequiredControls, marker);
            changed += SanitizeList(policy.Tags, marker);
        }

        foreach (ServiceCatalogEvidence svc in evidence.ServiceCatalog)
        {
            changed += SanitizeScalar(svc.ServiceId, v => svc.ServiceId = v, marker);
            changed += SanitizeScalar(svc.ServiceName, v => svc.ServiceName = v, marker);
            changed += SanitizeScalar(svc.Category, v => svc.Category = v, marker);
            changed += SanitizeScalar(svc.Summary, v => svc.Summary = v, marker);
            changed += SanitizeList(svc.Tags, marker);
            changed += SanitizeList(svc.RecommendedUseCases, marker);
        }

        foreach (PatternEvidence pattern in evidence.Patterns)
        {
            changed += SanitizeScalar(pattern.PatternId, v => pattern.PatternId = v, marker);
            changed += SanitizeScalar(pattern.Name, v => pattern.Name = v, marker);
            changed += SanitizeScalar(pattern.Summary, v => pattern.Summary = v, marker);
            changed += SanitizeList(pattern.ApplicableCapabilities, marker);
            changed += SanitizeList(pattern.SuggestedServices, marker);
        }

        if (evidence.PriorManifest is not null)
        {
            PriorManifestEvidence pm = evidence.PriorManifest;

            changed += SanitizeScalar(pm.Summary, v => pm.Summary = v, marker);
            changed += SanitizeList(pm.ExistingServices, marker);
            changed += SanitizeList(pm.ExistingDatastores, marker);
            changed += SanitizeList(pm.ExistingRequiredControls, marker);
        }

        foreach (EvidenceNote note in evidence.Notes)

            changed += SanitizeScalar(note.Message, v => note.Message = v, marker);

        if (changed <= 0)
            return Task.FromResult(changed);

        ArchLucidInstrumentation.EvidenceInjectionFieldsRedactedTotal.Add(changed);

        if (_logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarning(
                "Redacted {FieldCount} evidence field(s) for RunId={RunId} after injection-pattern match.",
                changed,
                evidence.RunId);

        return Task.FromResult(changed);
    }

    private int SanitizeList(List<string> rows, string marker)
    {
        int changed = 0;

        if (rows.Count == 0)
            return 0;

        for (int i = 0; i < rows.Count; i++)
        {
            string original = rows[i];

            if (!TryReplaceIfInjection(original, marker, out string replaced))
                continue;

            rows[i] = ApplySecretRedaction(replaced);
            changed++;
        }

        return changed;
    }

    private int SanitizeScalar(string original, Action<string> assign, string marker)
    {
        if (!TryReplaceIfInjection(original, marker, out string replaced))
            return 0;

        assign(ApplySecretRedaction(replaced));

        return 1;
    }

    private bool TryReplaceIfInjection(string? text, string marker, out string replaced)
    {
        replaced = text ?? string.Empty;

        if (string.IsNullOrEmpty(text))
            return false;

        if (PromptInjectionPatternSignals.Evaluate(text).Count == 0)
            return false;

        replaced = marker;

        return true;
    }

    private string ApplySecretRedaction(string text)
    {
        return !_redactionOptions.CurrentValue.Enabled ? text : _promptRedactor.Redact(text).Text;
    }
}
