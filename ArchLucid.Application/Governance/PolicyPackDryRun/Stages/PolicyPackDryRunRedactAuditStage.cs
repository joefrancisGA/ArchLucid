using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Governance.PolicyPackDryRun.Stages;

public sealed class PolicyPackDryRunRedactAuditStage(
    IPromptRedactor promptRedactor,
    IAuditService auditService,
    ILogger<PolicyPackDryRunRedactAuditStage> logger) : IPolicyPackDryRunRedactAuditStage
{
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));
    private readonly ILogger<PolicyPackDryRunRedactAuditStage> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IPromptRedactor _promptRedactor = promptRedactor ?? throw new ArgumentNullException(nameof(promptRedactor));

    public Dictionary<string, double> ParseThresholds(IReadOnlyDictionary<string, string> proposedThresholds)
    {
        Dictionary<string, double> parsed = new(StringComparer.OrdinalIgnoreCase);
        foreach (KeyValuePair<string, string> entry in proposedThresholds)
        {
            if (string.IsNullOrWhiteSpace(entry.Key) || string.IsNullOrWhiteSpace(entry.Value)) continue;
            if (!double.TryParse(entry.Value.Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out double value)) continue;
            parsed[entry.Key.Trim()] = value;
        }
        return parsed;
    }

    public string RedactProposedThresholdsJson(IReadOnlyDictionary<string, string> proposedThresholds)
    {
        string raw = JsonSerializer.Serialize(proposedThresholds, AuditJsonSerializationOptions.Instance);
        return _promptRedactor.Redact(raw).Text;
    }

    public async Task TryLogAuditAsync(
        Guid policyPackId, string proposedThresholdsRedactedJson, IReadOnlyList<string> evaluatedRunIds,
        PolicyPackDryRunDeltaCounts deltaCounts, CancellationToken cancellationToken)
    {
        string dataJson = JsonSerializer.Serialize(new
        {
            policyPackId,
            proposedThresholdsRedacted = proposedThresholdsRedactedJson,
            evaluatedRunIds,
            deltaCounts = new { evaluated = deltaCounts.Evaluated, wouldBlock = deltaCounts.WouldBlock, wouldAllow = deltaCounts.WouldAllow, runMissing = deltaCounts.RunMissing },
        }, AuditJsonSerializationOptions.Instance);
        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(new AuditEvent { EventType = AuditEventTypes.GovernanceDryRunRequested, DataJson = dataJson }, ct),
            _logger, $"GovernanceDryRunRequested:{policyPackId:D}", cancellationToken);
    }
}
