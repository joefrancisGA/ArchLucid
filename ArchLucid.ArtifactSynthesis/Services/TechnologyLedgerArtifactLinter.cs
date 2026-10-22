using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;

namespace ArchLucid.ArtifactSynthesis.Services;

/// <summary>
///     Pure, ledger-driven prose lint for synthesized buyer-facing artifacts (assessment D.5).
/// </summary>
public sealed class TechnologyLedgerArtifactLinter : ITechnologyLedgerArtifactLinter
{
    private const int AlternativeLabelWindowChars = 80;

    private static readonly string[] AlternativeLabels =
    [
        "alternative",
        "assumed",
        "proposed",
        "under consideration",
    ];

    private static readonly HashSet<string> LintTargetArtifactTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        ArtifactType.ArchitectureNarrative,
        ArtifactType.ReferenceArchitectureMarkdown,
        ArtifactType.MermaidDiagram,
        ArtifactType.TerraformAdvisory,
        ArtifactType.Inventory,
    };

    public IReadOnlyList<TechnologyLedgerArtifactLintFinding> Lint(
        ArtifactBundle bundle,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries,
        TechnologyLedgerArtifactLintOptions options)
    {
        ArgumentNullException.ThrowIfNull(bundle);
        ArgumentNullException.ThrowIfNull(ledgerEntries);
        ArgumentNullException.ThrowIfNull(options);

        if (ledgerEntries.Count == 0)
            return [];

        options.Normalize();

        if (!options.Enabled)
            return [];

        CloudProvider authoritativeCloud = ResolveAuthoritativeCloud(ledgerEntries);
        List<TechnologyLedgerArtifactLintFinding> findings = [];
        HashSet<string> dedupeKeys = new(StringComparer.Ordinal);

        foreach (SynthesizedArtifact artifact in bundle.Artifacts)
        {
            if (!LintTargetArtifactTypes.Contains(artifact.ArtifactType))
                continue;

            if (string.IsNullOrWhiteSpace(artifact.Content))
                continue;

            ScanArtifact(
                artifact,
                authoritativeCloud,
                ledgerEntries,
                findings,
                dedupeKeys);
        }

        return findings;
    }

    private static CloudProvider ResolveAuthoritativeCloud(IReadOnlyList<TechnologyLedgerEntry> ledgerEntries)
    {
        TechnologyLedgerEntry? chosenCloudPlatform = ledgerEntries
            .FirstOrDefault(entry =>
                entry.Role == TechnologyLedgerRole.CloudPlatform
                && entry.Status == TechnologyLedgerStatus.Chosen);

        if (chosenCloudPlatform is not null)
            return chosenCloudPlatform.ProviderFamily;

        return CloudProvider.None;
    }

    private static void ScanArtifact(
        SynthesizedArtifact artifact,
        CloudProvider authoritativeCloud,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries,
        List<TechnologyLedgerArtifactLintFinding> findings,
        HashSet<string> dedupeKeys)
    {
        string content = artifact.Content;

        foreach (TechnologyLedgerProseTokenCatalog.ProseTokenDefinition tokenDefinition in TechnologyLedgerProseTokenCatalog.AllTokens
                     .OrderByDescending(static definition => definition.Token.Length))
        {
            foreach (int matchIndex in FindTokenMatchIndexes(content, tokenDefinition.Token))
            {
                TryAddProseHyperscalerFamilyMismatch(
                    artifact,
                    authoritativeCloud,
                    tokenDefinition,
                    findings,
                    dedupeKeys);

                TryAddCloudNeutralProseProviderLeak(
                    artifact,
                    authoritativeCloud,
                    tokenDefinition,
                    ledgerEntries,
                    findings,
                    dedupeKeys);

                TryAddUnledgeredHyperscalerToken(
                    artifact,
                    content,
                    matchIndex,
                    tokenDefinition,
                    ledgerEntries,
                    findings,
                    dedupeKeys);
            }
        }
    }

    private static void TryAddProseHyperscalerFamilyMismatch(
        SynthesizedArtifact artifact,
        CloudProvider authoritativeCloud,
        TechnologyLedgerProseTokenCatalog.ProseTokenDefinition tokenDefinition,
        List<TechnologyLedgerArtifactLintFinding> findings,
        HashSet<string> dedupeKeys)
    {
        if (!IsHyperscalerFamily(authoritativeCloud))
            return;

        if (!IsHyperscalerFamily(tokenDefinition.ProviderFamily))
            return;

        if (tokenDefinition.ProviderFamily == authoritativeCloud)
            return;

        AddFinding(
            findings,
            dedupeKeys,
            ruleId: "ProseHyperscalerFamilyMismatch",
            artifact,
            tokenDefinition.Token,
            $"Expected {authoritativeCloud} prose but found {tokenDefinition.ProviderFamily} token.");
    }

    private static void TryAddCloudNeutralProseProviderLeak(
        SynthesizedArtifact artifact,
        CloudProvider authoritativeCloud,
        TechnologyLedgerProseTokenCatalog.ProseTokenDefinition tokenDefinition,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries,
        List<TechnologyLedgerArtifactLintFinding> findings,
        HashSet<string> dedupeKeys)
    {
        if (authoritativeCloud != CloudProvider.None)
            return;

        if (!IsHyperscalerFamily(tokenDefinition.ProviderFamily))
            return;

        if (IsAssumedOrAlternativeCorroborated(tokenDefinition, ledgerEntries))
            return;

        AddFinding(
            findings,
            dedupeKeys,
            ruleId: "CloudNeutralProseProviderLeak",
            artifact,
            tokenDefinition.Token,
            $"Cloud-neutral posture but prose contains {tokenDefinition.ProviderFamily} token.");
    }

    private static void TryAddUnledgeredHyperscalerToken(
        SynthesizedArtifact artifact,
        string content,
        int matchIndex,
        TechnologyLedgerProseTokenCatalog.ProseTokenDefinition tokenDefinition,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries,
        List<TechnologyLedgerArtifactLintFinding> findings,
        HashSet<string> dedupeKeys)
    {
        if (!IsHyperscalerFamily(tokenDefinition.ProviderFamily))
            return;

        if (IsLedgerTechnologyCorroborated(tokenDefinition.Token, ledgerEntries))
            return;

        if (HasAlternativeLabelNearby(content, matchIndex, tokenDefinition.Token.Length))
            return;

        AddFinding(
            findings,
            dedupeKeys,
            ruleId: "UnledgeredHyperscalerToken",
            artifact,
            tokenDefinition.Token,
            "Hyperscaler token is not corroborated by any ledger TechnologyName.");
    }

    private static bool IsAssumedOrAlternativeCorroborated(
        TechnologyLedgerProseTokenCatalog.ProseTokenDefinition tokenDefinition,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries)
    {
        return ledgerEntries.Any(entry =>
            (entry.Status == TechnologyLedgerStatus.Assumed || entry.Status == TechnologyLedgerStatus.Alternative)
            && entry.ProviderFamily == tokenDefinition.ProviderFamily
            && entry.TechnologyName.Contains(tokenDefinition.Token, StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsLedgerTechnologyCorroborated(
        string token,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries)
    {
        return ledgerEntries.Any(entry =>
            entry.TechnologyName.Contains(token, StringComparison.OrdinalIgnoreCase));
    }

    private static bool HasAlternativeLabelNearby(string content, int matchIndex, int tokenLength)
    {
        int start = Math.Max(0, matchIndex - AlternativeLabelWindowChars);
        int end = Math.Min(content.Length, matchIndex + tokenLength + AlternativeLabelWindowChars);
        string window = content[start..end];

        return AlternativeLabels.Any(label =>
            window.Contains(label, StringComparison.OrdinalIgnoreCase));
    }

    private static IEnumerable<int> FindTokenMatchIndexes(string content, string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            yield break;

        int searchStart = 0;

        while (searchStart <= content.Length - token.Length)
        {
            int index = content.IndexOf(token, searchStart, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                yield break;

            if (IsTokenBounded(content, index, token.Length))
                yield return index;

            searchStart = index + 1;
        }
    }

    private static bool IsTokenBounded(string content, int index, int length)
    {
        if (index > 0 && IsWordChar(content[index - 1]))
            return false;

        int endIndex = index + length;

        if (endIndex < content.Length && IsWordChar(content[endIndex]))
            return false;

        return true;
    }

    private static bool IsWordChar(char value)
    {
        return char.IsLetterOrDigit(value) || value == '_';
    }

    private static bool IsHyperscalerFamily(CloudProvider providerFamily)
    {
        return providerFamily is CloudProvider.Azure or CloudProvider.Aws or CloudProvider.Gcp;
    }

    private static void AddFinding(
        List<TechnologyLedgerArtifactLintFinding> findings,
        HashSet<string> dedupeKeys,
        string ruleId,
        SynthesizedArtifact artifact,
        string matchedToken,
        string message)
    {
        string dedupeKey = $"{ruleId}|{artifact.ArtifactType}|{matchedToken}";

        if (!dedupeKeys.Add(dedupeKey))
            return;

        findings.Add(
            new TechnologyLedgerArtifactLintFinding
            {
                RuleId = ruleId,
                ArtifactType = artifact.ArtifactType,
                ArtifactName = artifact.Name,
                Message = message,
                MatchedToken = matchedToken,
            });
    }
}
