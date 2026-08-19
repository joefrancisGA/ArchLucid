# One-shot patch applier for /al-bug itsm-inbound-webhooks tenant-scope IDOR fix.
param(
    [Parameter(Mandatory = $true)]
    [string] $RepoRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Set-FileText([string] $Path, [string] $Content) {
    $dir = Split-Path -Parent $Path
    if (-not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    Set-Content -LiteralPath $Path -Value $Content -NoNewline -Encoding utf8
}

$interfacePath = Join-Path $RepoRoot 'ArchLucid.Core/Persistence/ApplicationPorts/Integrations/IItsmFindingCorrelationRepository.cs'
$interface = Get-Content -LiteralPath $interfacePath -Raw
if ($interface -notmatch 'TryGetByExternalKeyForTenantAsync') {
    $interface = $interface.Replace(
        @'
    Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyAsync(
        string provider,
        string externalKey,
        CancellationToken ct);

    Task<ItsmFindingCorrelationRecord?> TryGetByFindingAndProviderAsync(
'@,
        @'
    Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyAsync(
        string provider,
        string externalKey,
        CancellationToken ct);

    Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyForTenantAsync(
        Guid tenantId,
        string provider,
        string externalKey,
        CancellationToken ct);

    Task<ItsmFindingCorrelationRecord?> TryGetByFindingAndProviderAsync(
'@)
    Set-FileText $interfacePath $interface
}

$syncPath = Join-Path $RepoRoot 'ArchLucid.Application/Integrations/Itsm/ItsmInboundWebhookSyncService.cs'
$sync = Get-Content -LiteralPath $syncPath -Raw
if ($sync -notmatch 'TryResolveCorrelationAsync') {
    $sync = $sync.Replace(
        '        string? deliveryId = null)',
        '        string? deliveryId = null,
        Guid? authenticatedTenantId = null)')
    $sync = $sync.Replace(
        'await _correlations.TryGetByExternalKeyAsync("Jira", issueKey, ct).ConfigureAwait(false);',
        'await TryResolveCorrelationAsync("Jira", issueKey, authenticatedTenantId, ct).ConfigureAwait(false);')
    $sync = $sync.Replace(
        'await _correlations.TryGetByExternalKeyAsync("ServiceNow", externalKey, ct).ConfigureAwait(false);',
        'await TryResolveCorrelationAsync("ServiceNow", externalKey, authenticatedTenantId, ct).ConfigureAwait(false);')
    $sync = $sync.Replace(
        '    private static bool ValidateCorrelationFindingId(',
        @'
    private async Task<ItsmFindingCorrelationRecord?> TryResolveCorrelationAsync(
        string provider,
        string externalKey,
        Guid? authenticatedTenantId,
        CancellationToken ct)
    {
        if (authenticatedTenantId is { } tenantId && tenantId != Guid.Empty)
        {
            return await _correlations
                .TryGetByExternalKeyForTenantAsync(tenantId, provider, externalKey, ct)
                .ConfigureAwait(false);
        }

        return await _correlations.TryGetByExternalKeyAsync(provider, externalKey, ct).ConfigureAwait(false);
    }

    private static bool ValidateCorrelationFindingId(
'@)
    Set-FileText $syncPath $sync
}

$inMemoryPath = Join-Path $RepoRoot 'ArchLucid.Persistence/Integrations/InMemoryItsmFindingCorrelationRepository.cs'
$inMemory = Get-Content -LiteralPath $inMemoryPath -Raw
if ($inMemory -notmatch 'TryGetByExternalKeyForTenantAsync') {
    $inMemory = $inMemory.Replace(
        @'
        return Task.FromResult<ItsmFindingCorrelationRecord?>(matches[0]);
    }

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> TryGetByFindingAndProviderAsync(
'@,
        @'
        return Task.FromResult<ItsmFindingCorrelationRecord?>(matches[0]);
    }

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyForTenantAsync(
        Guid tenantId,
        string provider,
        string externalKey,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("provider is required.", nameof(provider));

        if (string.IsNullOrWhiteSpace(externalKey))
            throw new ArgumentException("externalKey is required.", nameof(externalKey));

        ItsmFindingCorrelationRecord? match = MatchByProviderAndExternalKey(provider, externalKey)
            .SingleOrDefault(r => r.TenantId == tenantId);

        return Task.FromResult(match);
    }

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> TryGetByFindingAndProviderAsync(
'@)
    Set-FileText $inMemoryPath $inMemory
}

$sqlPath = Join-Path $RepoRoot 'ArchLucid.Persistence/Integrations/SqlItsmFindingCorrelationRepository.cs'
$sql = Get-Content -LiteralPath $sqlPath -Raw
if ($sql -notmatch 'TryGetByExternalKeyForTenantCoreAsync') {
    $sql = $sql.Replace(
        @'
    public Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyAsync(
        string provider,
        string externalKey,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => TryGetByExternalKeyCoreAsync(provider, externalKey, cancellationToken),
            ct);

    /// <inheritdoc />
    public Task RegisterAsync(
'@,
        @'
    public Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyAsync(
        string provider,
        string externalKey,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => TryGetByExternalKeyCoreAsync(provider, externalKey, cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyForTenantAsync(
        Guid tenantId,
        string provider,
        string externalKey,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => TryGetByExternalKeyForTenantCoreAsync(tenantId, provider, externalKey, cancellationToken),
            ct);

    /// <inheritdoc />
    public Task RegisterAsync(
'@)
    $sql = $sql.Replace(
        @'
        return matches[0];
    }

    private async Task RegisterCoreAsync(
'@,
        @'
        return matches[0];
    }

    private async Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyForTenantCoreAsync(
        Guid tenantId,
        string provider,
        string externalKey,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("provider is required.", nameof(provider));

        if (string.IsNullOrWhiteSpace(externalKey))
            throw new ArgumentException("externalKey is required.", nameof(externalKey));

        const string sql = $"""
                           SELECT {CorrelationSelectColumns}
                           FROM dbo.ItsmFindingCorrelations
                           WHERE TenantId = @TenantId AND Provider = @Provider AND ExternalKey = @ExternalKey;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new
            {
                TenantId = tenantId,
                Provider = provider.Trim(),
                ExternalKey = externalKey.Trim()
            },
            cancellationToken: ct);

        return await connection.QuerySingleOrDefaultAsync<ItsmFindingCorrelationRecord>(cmd);
    }

    private async Task RegisterCoreAsync(
'@)
    Set-FileText $sqlPath $sql
}

$controllerPath = Join-Path $RepoRoot 'ArchLucid.Api/Controllers/Integrations/ItsmInboundWebhooksController.cs'
$controller = Get-Content -LiteralPath $controllerPath -Raw
$controller = $controller.Replace(
    'await _sync.TryProcessJiraIssueUpdateAsync(doc.RootElement, ct, payloadUtf8Bytes, ResolveDeliveryId()).ConfigureAwait(false);',
    'await _sync.TryProcessJiraIssueUpdateAsync(doc.RootElement, ct, payloadUtf8Bytes, ResolveDeliveryId(), tenantId).ConfigureAwait(false);')
$controller = $controller.Replace(
    'await _sync.TryProcessServiceNowIncidentUpdateAsync(doc.RootElement, ct, payloadUtf8Bytes, ResolveDeliveryId()).ConfigureAwait(false);',
    'await _sync.TryProcessServiceNowIncidentUpdateAsync(doc.RootElement, ct, payloadUtf8Bytes, ResolveDeliveryId(), tenantId).ConfigureAwait(false);')
Set-FileText $controllerPath $controller

$testsPath = Join-Path $RepoRoot 'ArchLucid.Application.Tests/Integrations/Itsm/ItsmInboundWebhookSyncServiceTests.cs'
$tests = Get-Content -LiteralPath $testsPath -Raw
if ($tests -notmatch 'Jira_tenant_scoped_webhook_does_not_mutate_correlation_owned_by_another_tenant') {
    $tests = $tests.Replace(
        '    [Fact]
    public async Task Jira_replay_of_same_delivery_id_is_accepted_without_second_mutation()',
        @'
    [Fact]
    public async Task Jira_tenant_scoped_webhook_does_not_mutate_correlation_owned_by_another_tenant()
    {
        Guid tenantB = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KEY-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord
                {
                    TenantId = tenantB,
                    WorkspaceId = WorkspaceA,
                    ProjectId = ProjectA,
                    FindingId = "f-other-tenant"
                });
        correlations
            .Setup(c => c.TryGetByExternalKeyForTenantAsync(TenantA, "Jira", "KEY-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ItsmFindingCorrelationRecord?)null);
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        using JsonDocument doc = JsonDocument.Parse(
            """{"issue":{"key":"KEY-1","fields":{"status":{"name":"Done"}}}}""");
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None, authenticatedTenantId: TenantA);

        r.Accepted.Should().BeTrue();
        r.DurableAuditEvent.Should().BeNull();
        correlations.Verify(
            c => c.TryGetByExternalKeyForTenantAsync(TenantA, "Jira", "KEY-1", It.IsAny<CancellationToken>()),
            Times.Once);
        correlations.Verify(
            c => c.TryGetByExternalKeyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Jira_replay_of_same_delivery_id_is_accepted_without_second_mutation()
'@)
    Set-FileText $testsPath $tests
}

$ledgerPath = Join-Path $RepoRoot 'docs/library/AL_BUG_HUNT_LEDGER.md'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw
if ($ledger -match '## Zone: itsm-inbound-webhooks[\s\S]*?\*\*hunts:\*\* 0') {
    $ledger = $ledger -replace '(## Zone: itsm-inbound-webhooks[\s\S]*?)\*\*status:\*\* unseeded', '$1**status:** open'
    $ledger = $ledger -replace '(## Zone: itsm-inbound-webhooks[\s\S]*?)\*\*hunts:\*\* 0', '$1**hunts:** 1'
    $ledger = $ledger -replace '(## Zone: itsm-inbound-webhooks[\s\S]*?)\*\*bugs-found:\*\* 0', '$1**bugs-found:** 1'
    $ledger = $ledger -replace '(## Zone: itsm-inbound-webhooks[\s\S]*?)\*\*last-hunt:\*\* never', '$1**last-hunt:** 2026-08-18'
    $ledger = $ledger -replace '(## Zone: itsm-inbound-webhooks[\s\S]*?)\*\*last-bug:\*\* never', '$1**last-bug:** 2026-08-18'
    $ledger = $ledger.Replace(
        @'
- [ ] (candidate) Webhook accepted when the shared secret does not match the connector config
- [ ] (candidate) Replay guard allows duplicate delivery of the same event id
- [ ] (candidate) Inbound payload is applied to a tenant inferred from the body instead of the authenticated connector
'@,
        @'
- [x] (candidate) Webhook accepted when the shared secret does not match the connector config - invalid: WebhookSecrets.SecureEquals rejects before parse
- [ ] (candidate) Replay guard allows duplicate delivery of the same event id - not reproduced; sequential replay covered
- [x] (candidate) Inbound payload is applied to a tenant inferred from the body instead of the authenticated connector - fixed: tenant-scoped routes use TryGetByExternalKeyForTenantAsync
'@)
    Set-FileText $ledgerPath $ledger
}

Write-Host 'Applied ITSM tenant-scope fix under' $RepoRoot
