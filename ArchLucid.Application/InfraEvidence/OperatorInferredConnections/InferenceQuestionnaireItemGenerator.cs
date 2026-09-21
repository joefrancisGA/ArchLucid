using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.OperatorInferredConnections;

public interface IInferenceQuestionnaireItemGenerator
{
    IReadOnlyList<OperatorInferredConnectionRecord> Generate(
        ScopeContext scope,
        InferenceQuestionnaireInput input,
        IReadOnlyList<OperatorInferredConnectionRecord> existing);

    Task<IReadOnlyList<OperatorInferredConnectionRecord>> GenerateAndPersistAsync(
        ScopeContext scope,
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<OperatorInferredConnectionRecord> existing,
        CancellationToken cancellationToken = default);
}

public sealed class InferenceQuestionnaireItemGenerator(
    IOperatorInferredConnectionRepository connectionRepository) : IInferenceQuestionnaireItemGenerator
{
    public const int MaxItems = 50;

    public const string CatalogTemplateRuleName = "Tenant catalog template";

    public const string SqlCatalogMissingRuleName = "SQL catalog missing";

    public const string UnresolvedHostRuleName = "Unresolved host";

    public const string SameCaeUiApiRuleName = "Same CAE UI to API";

    public async Task<IReadOnlyList<OperatorInferredConnectionRecord>> GenerateAndPersistAsync(
        ScopeContext scope,
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<OperatorInferredConnectionRecord> existing,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(snapshot);

        IReadOnlyList<string> warnings = AzureInventorySnapshotCompletenessWarningsJson
            .Deserialize(snapshot.Header.CompletenessWarningsJson);

        InferenceQuestionnaireInput input = new()
        {
            Snapshot = snapshot,
            CompletenessWarnings = warnings,
        };

        IReadOnlyList<OperatorInferredConnectionRecord> generated = Generate(scope, input, existing);

        if (generated.Count == 0)
        {
            return [];
        }

        await connectionRepository.UpsertProposalsAsync(generated, cancellationToken);

        return generated;
    }

    public IReadOnlyList<OperatorInferredConnectionRecord> Generate(
        ScopeContext scope,
        InferenceQuestionnaireInput input,
        IReadOnlyList<OperatorInferredConnectionRecord> existing)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(input);

        List<OperatorInferredConnectionRecord> items = [];
        HashSet<string> dedupeKeys = BuildDedupeKeys(input.Snapshot, existing);
        HashSet<string> payloadHashes = existing
            .Select(record => Convert.ToHexString(record.ProposalPayloadHashSha256))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        Dictionary<Guid, IReadOnlyDictionary<string, string>> propertiesByResourceRowId =
            BuildPropertiesByResourceRowId(input.Snapshot);

        List<AzureExtractorExtendedResourceRow> extendedResources = input.Snapshot.Resources
            .Select(resource => new AzureExtractorExtendedResourceRow
            {
                AzureResourceId = resource.AzureResourceId,
                ResourceType = resource.ResourceType,
                Name = ReadResourceName(resource.AzureResourceId),
                Properties = propertiesByResourceRowId.GetValueOrDefault(resource.ResourceRowId)
                             ?? new Dictionary<string, string>(),
            })
            .ToList();

        Dictionary<string, string> hostToArmId = AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(extendedResources);

        EmitCatalogTemplateItems(scope, input, items, dedupeKeys, payloadHashes, hostToArmId, utcNow);
        EmitSqlCatalogMissingItems(scope, input, items, dedupeKeys, payloadHashes, hostToArmId, utcNow);
        EmitUnresolvedHostItems(scope, input, items, dedupeKeys, payloadHashes, utcNow);
        EmitSameCaeUiApiItems(scope, input, items, dedupeKeys, payloadHashes, hostToArmId, propertiesByResourceRowId, utcNow);

        if (items.Count > MaxItems)
        {
            return items.Take(MaxItems).ToList();
        }

        return items;
    }

    private static void EmitCatalogTemplateItems(
        ScopeContext scope,
        InferenceQuestionnaireInput input,
        List<OperatorInferredConnectionRecord> items,
        HashSet<string> dedupeKeys,
        HashSet<string> payloadHashes,
        IReadOnlyDictionary<string, string> hostToArmId,
        DateTime utcNow)
    {
        foreach (AzureInventoryAppSettingHostRow row in input.AppSettingHosts)
        {
            if (!string.Equals(
                    row.WarningCode,
                    AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsCatalogTemplate,
                    StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(row.Host))
            {
                continue;
            }

            string normalizedHost = row.Host.Trim().ToLowerInvariant();

            if (!hostToArmId.TryGetValue(normalizedHost, out _))
            {
                continue;
            }

            string? fromLabel = TryResolveResourceLabel(input.Snapshot, row.SiteResourceId);

            foreach (AzureInventoryResourceRecord database in input.Snapshot.Resources)
            {
                if (!IsUserDatabaseOnServer(database, normalizedHost))
                {
                    continue;
                }

                if (!TryAddItem(
                        scope,
                        input.Snapshot.Header.SnapshotId,
                        items,
                        dedupeKeys,
                        payloadHashes,
                        utcNow,
                        ruleName: CatalogTemplateRuleName,
                        questionText: $"Does {fromLabel ?? "this app"} connect to database {ReadResourceName(database.AzureResourceId)} on {normalizedHost}?",
                        fromArmId: row.SiteResourceId,
                        fromLabel: fromLabel,
                        toHost: normalizedHost,
                        toCatalog: ReadResourceName(database.AzureResourceId),
                        toArmId: database.AzureResourceId,
                        toCloudResourceId: database.CloudResourceId,
                        settingName: row.SettingName))
                {
                    return;
                }
            }
        }
    }

    private static void EmitSqlCatalogMissingItems(
        ScopeContext scope,
        InferenceQuestionnaireInput input,
        List<OperatorInferredConnectionRecord> items,
        HashSet<string> dedupeKeys,
        HashSet<string> payloadHashes,
        IReadOnlyDictionary<string, string> hostToArmId,
        DateTime utcNow)
    {
        foreach (AzureInventoryAppSettingHostRow row in input.AppSettingHosts)
        {
            if (string.IsNullOrWhiteSpace(row.Host)
                || !string.IsNullOrWhiteSpace(row.Catalog)
                || !string.Equals(
                    row.WarningCode,
                    AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsSqlCatalogMissing,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string normalizedHost = row.Host.Trim().ToLowerInvariant();

            if (!hostToArmId.TryGetValue(normalizedHost, out _))
            {
                continue;
            }

            string? fromLabel = TryResolveResourceLabel(input.Snapshot, row.SiteResourceId);

            TryAddItem(
                scope,
                input.Snapshot.Header.SnapshotId,
                items,
                dedupeKeys,
                payloadHashes,
                utcNow,
                ruleName: SqlCatalogMissingRuleName,
                questionText: $"Which database does {fromLabel ?? "this app"} use on {normalizedHost}?",
                fromArmId: row.SiteResourceId,
                fromLabel: fromLabel,
                toHost: normalizedHost,
                settingName: row.SettingName);
        }
    }

    private static void EmitUnresolvedHostItems(
        ScopeContext scope,
        InferenceQuestionnaireInput input,
        List<OperatorInferredConnectionRecord> items,
        HashSet<string> dedupeKeys,
        HashSet<string> payloadHashes,
        DateTime utcNow)
    {
        foreach (string warning in input.CompletenessWarnings)
        {
            if (!warning.StartsWith(
                    AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsHostUnresolved + ":",
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string host = warning[(AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsHostUnresolved.Length + 1)..]
                .Trim()
                .ToLowerInvariant();

            TryAddItem(
                scope,
                input.Snapshot.Header.SnapshotId,
                items,
                dedupeKeys,
                payloadHashes,
                utcNow,
                ruleName: UnresolvedHostRuleName,
                questionText: $"Which inventoried resource is {host}?",
                toHost: host);
        }
    }

    private static void EmitSameCaeUiApiItems(
        ScopeContext scope,
        InferenceQuestionnaireInput input,
        List<OperatorInferredConnectionRecord> items,
        HashSet<string> dedupeKeys,
        HashSet<string> payloadHashes,
        IReadOnlyDictionary<string, string> hostToArmId,
        IReadOnlyDictionary<Guid, IReadOnlyDictionary<string, string>> propertiesByResourceRowId,
        DateTime utcNow)
    {
        Dictionary<string, List<AzureInventoryResourceRecord>> appsByEnvironment = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRelationshipReadModel relationship in input.Snapshot.Relationships)
        {
            if (!string.Equals(
                    relationship.InferenceSource,
                    GraphEdgeInferenceSources.InventoryContainerAppEnv,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!appsByEnvironment.TryGetValue(relationship.ToAzureResourceId, out List<AzureInventoryResourceRecord>? apps))
            {
                apps = [];
                appsByEnvironment[relationship.ToAzureResourceId] = apps;
            }

            AzureInventoryResourceRecord? app = input.Snapshot.Resources
                .FirstOrDefault(resource => resource.AzureResourceId.Equals(
                    relationship.FromAzureResourceId,
                    StringComparison.OrdinalIgnoreCase));

            if (app is not null)
            {
                apps.Add(app);
            }
        }

        foreach ((string environmentArmId, List<AzureInventoryResourceRecord> apps) in appsByEnvironment)
        {
            if (apps.Count < 2)
            {
                continue;
            }

            List<(AzureInventoryResourceRecord App, string Fqdn)> ingressApps = apps
                .Select(app => (App: app, Fqdn: TryReadIngressFqdn(app, propertiesByResourceRowId)))
                .Where(pair => !string.IsNullOrWhiteSpace(pair.Fqdn))
                .Select(pair => (pair.App, pair.Fqdn!))
                .ToList();

            if (ingressApps.Count != 1)
            {
                continue;
            }

            (AzureInventoryResourceRecord apiApp, string apiFqdn) = ingressApps[0];

            foreach (AzureInventoryResourceRecord uiApp in apps)
            {
                if (uiApp.AzureResourceId.Equals(apiApp.AzureResourceId, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (AppSettingHostsContainFqdn(input.AppSettingHosts, uiApp.AzureResourceId, apiFqdn))
                {
                    continue;
                }

                if (!hostToArmId.TryGetValue(apiFqdn.ToLowerInvariant(), out string? apiArmId))
                {
                    continue;
                }

                string uiLabel = ReadResourceName(uiApp.AzureResourceId);
                string apiLabel = ReadResourceName(apiApp.AzureResourceId);

                TryAddItem(
                    scope,
                    input.Snapshot.Header.SnapshotId,
                    items,
                    dedupeKeys,
                    payloadHashes,
                    utcNow,
                    ruleName: SameCaeUiApiRuleName,
                    questionText: $"Does {uiLabel} call {apiLabel} at {apiFqdn}?",
                    fromArmId: uiApp.AzureResourceId,
                    fromLabel: uiLabel,
                    toHost: apiFqdn,
                    toArmId: apiArmId,
                    toCloudResourceId: apiApp.CloudResourceId);
            }
        }
    }

    private static bool TryAddItem(
        ScopeContext scope,
        Guid snapshotId,
        List<OperatorInferredConnectionRecord> items,
        HashSet<string> dedupeKeys,
        HashSet<string> payloadHashes,
        DateTime utcNow,
        string ruleName,
        string questionText,
        string? fromArmId = null,
        string? fromLabel = null,
        string? toHost = null,
        string? toCatalog = null,
        string? toArmId = null,
        Guid? toCloudResourceId = null,
        string? settingName = null)
    {
        if (items.Count >= MaxItems)
        {
            return false;
        }

        string dedupeKey = $"{fromArmId ?? fromLabel}|{toArmId ?? toHost}|{toCatalog}";

        if (!dedupeKeys.Add(dedupeKey))
        {
            return true;
        }

        OperatorInferredConnectionProposalSeed seed = new()
        {
            SnapshotId = snapshotId,
            Source = OperatorInferredConnectionSource.Questionnaire,
            RuleName = ruleName,
            FromArmId = fromArmId,
            FromLabel = fromLabel,
            ToHost = toHost,
            ToCatalog = toCatalog,
            SettingName = settingName,
            QuestionText = questionText,
        };

        byte[] payloadHash = OperatorInferredConnectionGuard.ComputeProposalPayloadHash(seed);
        string payloadHashHex = Convert.ToHexString(payloadHash);

        if (!payloadHashes.Add(payloadHashHex))
        {
            return true;
        }

        items.Add(new OperatorInferredConnectionRecord
        {
            ConnectionId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            SnapshotId = snapshotId,
            Status = OperatorInferredConnectionStatus.Proposed,
            Source = OperatorInferredConnectionSource.Questionnaire,
            RuleName = ruleName,
            QuestionText = questionText,
            FromArmId = fromArmId,
            FromLabel = fromLabel,
            ToHost = toHost,
            ToCatalog = toCatalog,
            ToArmId = toArmId,
            ToCloudResourceId = toCloudResourceId,
            SettingName = settingName,
            ProposalPayloadHashSha256 = payloadHash,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        });

        return true;
    }

    private static HashSet<string> BuildDedupeKeys(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<OperatorInferredConnectionRecord> existing)
    {
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRelationshipReadModel relationship in snapshot.Relationships)
        {
            if (relationship.ProvenanceKind == ProvenanceKind.DeterministicInference
                || string.Equals(
                    relationship.InferenceSource,
                    GraphEdgeInferenceSources.InventoryAppAuthorizedAccess,
                    StringComparison.OrdinalIgnoreCase))
            {
                keys.Add($"{relationship.FromAzureResourceId}|{relationship.ToAzureResourceId}|");
            }
        }

        foreach (OperatorInferredConnectionRecord record in existing)
        {
            keys.Add($"{record.FromArmId ?? record.FromLabel}|{record.ToArmId ?? record.ToHost}|{record.ToCatalog}");
        }

        return keys;
    }

    private static bool IsUserDatabaseOnServer(AzureInventoryResourceRecord database, string normalizedHost)
    {
        if (!database.ResourceType.Contains("/databases", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (AzureInventoryNeverShowSqlDatabaseNames.ShouldOmit(
                database.ResourceType,
                database.AzureResourceId,
                ReadResourceName(database.AzureResourceId)))
        {
            return false;
        }

        return database.AzureResourceId.Contains(normalizedHost, StringComparison.OrdinalIgnoreCase)
               || database.AzureResourceId.Contains(
                   $"/databases/{ReadResourceName(database.AzureResourceId)}",
                   StringComparison.OrdinalIgnoreCase);
    }

    private static Dictionary<Guid, IReadOnlyDictionary<string, string>> BuildPropertiesByResourceRowId(
        AzureInventorySnapshotDetailReadModel snapshot)
    {
        Dictionary<Guid, Dictionary<string, string>> properties = new();

        foreach (AzureInventoryResourcePropertyReadModel property in snapshot.Properties)
        {
            if (!properties.TryGetValue(property.ResourceRowId, out Dictionary<string, string>? map))
            {
                map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                properties[property.ResourceRowId] = map;
            }

            if (!string.IsNullOrWhiteSpace(property.PropertyKey) && !string.IsNullOrWhiteSpace(property.PropertyValue))
            {
                map[property.PropertyKey] = property.PropertyValue;
            }
        }

        return properties.ToDictionary(
            pair => pair.Key,
            pair => (IReadOnlyDictionary<string, string>)pair.Value);
    }

    private static string ReadResourceName(string azureResourceId)
    {
        string[] segments = azureResourceId.Split(
            '/',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        return segments.Length == 0 ? azureResourceId : segments[^1];
    }

    private static string? TryResolveResourceLabel(AzureInventorySnapshotDetailReadModel snapshot, string armId) =>
        snapshot.Resources
            .FirstOrDefault(resource => resource.AzureResourceId.Equals(armId, StringComparison.OrdinalIgnoreCase))
            is { } resource
            ? ReadResourceName(resource.AzureResourceId)
            : null;

    private static string? TryReadIngressFqdn(
        AzureInventoryResourceRecord app,
        IReadOnlyDictionary<Guid, IReadOnlyDictionary<string, string>> propertiesByResourceRowId)
    {
        if (!propertiesByResourceRowId.TryGetValue(app.ResourceRowId, out IReadOnlyDictionary<string, string>? properties))
        {
            return null;
        }

        if (properties.TryGetValue("configuration.ingress.fqdn", out string? fqdn))
        {
            return fqdn;
        }

        return properties.TryGetValue("ingress.fqdn", out fqdn) ? fqdn : null;
    }

    private static bool AppSettingHostsContainFqdn(
        IReadOnlyList<AzureInventoryAppSettingHostRow> rows,
        string siteResourceId,
        string fqdn)
    {
        string normalizedFqdn = fqdn.Trim().ToLowerInvariant();

        return rows.Any(row =>
            row.SiteResourceId.Equals(siteResourceId, StringComparison.OrdinalIgnoreCase)
            && string.Equals(row.Host, normalizedFqdn, StringComparison.OrdinalIgnoreCase));
    }
}
