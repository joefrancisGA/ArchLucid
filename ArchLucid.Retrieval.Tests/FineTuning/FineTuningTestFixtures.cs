using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Persistence.ApplicationPorts.FineTuning;
using ArchLucid.Retrieval.FineTuning;
using ArchLucid.Retrieval.FineTuning.Consent;
using ArchLucid.Retrieval.FineTuning.Models;
using ArchLucid.Retrieval.FineTuning.Redaction;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Tests.FineTuning;

internal sealed class FixedValueOptionsMonitor<TOptions>(TOptions value) : IOptionsMonitor<TOptions>
{
    public TOptions CurrentValue => value;

    public TOptions Get(string? name) => value;

    public IDisposable? OnChange(Action<TOptions, string?> listener) => null;
}

internal static class FineTuningTestFixtures
{
    internal static AcceptedManifestTrainingRedactor CreateRedactor(bool enabled = true)
    {
        FixedValueOptionsMonitor<LlmPromptRedactionOptions> options =
            new(new LlmPromptRedactionOptions { Enabled = enabled });

        return new AcceptedManifestTrainingRedactor(
            new PromptRedactor(options, NullLogger<PromptRedactor>.Instance));
    }

    internal static ManifestDocument CreateSampleManifest(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string rationale = "Use private endpoints.")
    {
        return new ManifestDocument
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            ManifestId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            Decisions =
            [
                new ResolvedArchitectureDecision
                {
                    Category = "Security",
                    Title = "Encrypt data at rest",
                    SelectedOption = "Azure Storage SSE",
                    Rationale = rationale,
                },
            ],
            Policy = new PolicySection(),
        };
    }

    internal static IOptionsMonitor<FineTuningOptions> CreateOptions(double minRatio = 0.80, bool enabled = false) =>
        new FixedValueOptionsMonitor<FineTuningOptions>(new FineTuningOptions
        {
            MinEvalSupportRatio = minRatio,
            Enabled = enabled,
            BaseModelDeploymentName = enabled ? "gpt-4o-mini" : string.Empty,
        });
}

internal sealed class FakeFineTuningConsentService(FineTuningConsentStatus status) : IFineTuningConsentService
{
    public Task<FineTuningConsentStatus> GetConsentAsync(Guid tenantId, CancellationToken cancellationToken) =>
        Task.FromResult(status);

    public Task RequireExportConsentAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        if (status != FineTuningConsentStatus.Enabled)
        {
            throw new InvalidOperationException(
                "Manifest fine-tuning export requires tenant consent FineTuning.ManifestConsent=Enabled.");
        }

        return Task.CompletedTask;
    }
}

internal sealed class InMemoryFineTuningManifestConsentReaderDouble : IFineTuningManifestConsentReader
{
    private readonly Dictionary<Guid, string> _values = new();

    public void Set(Guid tenantId, string value) => _values[tenantId] = value;

    public Task<string?> TryGetRawConsentAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        _values.TryGetValue(tenantId, out string? value);

        return Task.FromResult<string?>(value);
    }
}

internal sealed class InMemoryTenantSettingsRepositoryDouble : ArchLucid.Persistence.Tenancy.ITenantSettingsRepository
{
    private readonly Dictionary<(Guid TenantId, string Key), string> _store = new();

    public Task<string?> TryGetAsync(Guid tenantId, string settingKey, CancellationToken cancellationToken)
    {
        _store.TryGetValue((tenantId, settingKey), out string? value);

        return Task.FromResult<string?>(value);
    }

    public Task UpsertAsync(Guid tenantId, string settingKey, string settingValue, CancellationToken cancellationToken)
    {
        _store[(tenantId, settingKey)] = settingValue;

        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid tenantId, string settingKey, CancellationToken cancellationToken)
    {
        _store.Remove((tenantId, settingKey));

        return Task.CompletedTask;
    }
}
