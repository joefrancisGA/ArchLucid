using System.Text.RegularExpressions;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DeploymentEvidenceTerraformReferenceTests
{
    [Fact]
    public void DefaultApplyOrderRoots_lists_composition_waves_then_hosted_leaves()
    {
        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();

        roots.Should().Contain(r => r.Contains("infra/terraform-foundation", StringComparison.Ordinal));
        roots.Should().Contain(r => r.Contains("infra/terraform-pilot", StringComparison.Ordinal));

        int foundationIndex = IndexOfPath(roots, "infra/terraform-foundation");
        int privateIndex = IndexOfPath(roots, "infra/terraform-private");
        int monitoringIndex = IndexOfPath(roots, "infra/terraform-monitoring");
        int orchestratorIndex = IndexOfPath(roots, "infra/terraform-orchestrator");
        int pilotIndex = IndexOfPath(roots, "infra/terraform-pilot");

        foundationIndex.Should().BeGreaterThanOrEqualTo(0);
        privateIndex.Should().BeGreaterThan(foundationIndex);
        monitoringIndex.Should().BeGreaterThan(privateIndex);
        orchestratorIndex.Should().BeGreaterThan(monitoringIndex);
        pilotIndex.Should().BeGreaterThan(orchestratorIndex);

        roots.Should().Contain(r => r.Contains("infra/terraform-redis", StringComparison.Ordinal));
        roots.Should().Contain(r => r.Contains("infra/terraform-cosmos", StringComparison.Ordinal));
        roots.Should().Contain(r => r.Contains("infra/terraform-acr", StringComparison.Ordinal));

        int acrIndex = IndexOfPath(roots, "infra/terraform-acr");
        int entraIndex = IndexOfPath(roots, "infra/terraform-entra");

        acrIndex.Should().BeGreaterThanOrEqualTo(0);
        entraIndex.Should().BeGreaterThan(acrIndex);
    }

    [Fact]
    public void DefaultApplyOrderRoots_leaf_sequence_matches_apply_saas_multi_root_order()
    {
        string[] expectedLeafPaths =
        [
            "infra/terraform-private",
            "infra/terraform-keyvault",
            "infra/terraform-sql-failover",
            "infra/terraform-storage",
            "infra/terraform-redis",
            "infra/terraform-cosmos",
            "infra/terraform-servicebus",
            "infra/terraform-logicapps",
            "infra/terraform-openai",
            "infra/terraform-acr",
            "infra/terraform-entra",
            "infra/terraform-container-apps",
            "infra/terraform-edge",
            "infra/terraform",
            "infra/terraform-monitoring",
            "infra/terraform-orchestrator",
        ];

        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();
        List<string> leafPaths = roots
            .Where(line => !line.Contains("metadata composition root", StringComparison.Ordinal)
                && !line.Contains("canonical default profile", StringComparison.Ordinal))
            .Select(line => line.Split(" —", 2, StringSplitOptions.None)[0].Trim())
            .ToList();

        leafPaths.Should().Equal(expectedLeafPaths);
    }

    [Fact]
    public void DefaultApplyOrderRoots_leaf_sequence_matches_apply_saas_ps1_multiRootSequence()
    {
        string repoRoot = RequireRepositoryRoot();
        IReadOnlyList<string> applySaasLeaves = ReadApplySaasStringArray(repoRoot, "$multiRootSequence");
        IReadOnlyList<string> evidenceLeaves = ExtractLeafPaths(DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots());

        evidenceLeaves.Should().Equal(applySaasLeaves);
    }

    [Fact]
    public void DefaultApplyOrderRoots_composition_roots_match_apply_saas_ps1_hostedCompositionRoots()
    {
        string repoRoot = RequireRepositoryRoot();
        IReadOnlyList<string> applySaasComposition = ReadApplySaasStringArray(repoRoot, "$hostedCompositionRoots");
        IReadOnlyList<string> evidenceComposition = ExtractCompositionRootPaths(
            DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots());

        evidenceComposition.Should().Equal(applySaasComposition);
    }

    [Fact]
    public void DefaultApplyOrderRoots_default_pilot_profile_matches_apply_saas_ps1_pilotProfileOnly()
    {
        string repoRoot = RequireRepositoryRoot();
        IReadOnlyList<string> applySaasPilot = ReadApplySaasStringArray(repoRoot, "$pilotProfileOnly");
        IReadOnlyList<string> evidencePilot = ExtractDefaultPilotProfilePaths(
            DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots());

        evidencePilot.Should().Equal(applySaasPilot);
    }

    [Fact]
    public void DocumentationRelativePath_points_to_existing_reference_doc()
    {
        string repoRoot = RequireRepositoryRoot();
        string docPath = Path.Combine(repoRoot, DeploymentEvidenceTerraformReference.DocumentationRelativePath);

        File.Exists(docPath).Should().BeTrue("deployment evidence must cite an on-disk stack-order reference");
    }

    [Fact]
    public void DefaultApplyOrderRoots_hosted_wave_leaves_match_apply_saas_ps1_wave_flatten()
    {
        string repoRoot = RequireRepositoryRoot();
        IReadOnlyList<string> applySaasHostedWaves = ReadApplySaasHostedWaveLeaves(repoRoot);
        List<string> evidenceLeaves = ExtractLeafPaths(DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots());
        List<string> evidenceHostedLeaves = evidenceLeaves
            .Where(path => !path.Contains("terraform-orchestrator", StringComparison.Ordinal))
            .ToList();

        evidenceHostedLeaves.Should().Equal(applySaasHostedWaves);
    }

    [Fact]
    public void ReadApplySaasHostedWaveLeaves_equals_sum_of_foundation_platform_app_arrays()
    {
        string repoRoot = RequireRepositoryRoot();
        IReadOnlyList<string> foundation = ReadApplySaasStringArray(repoRoot, "$foundationWaveLeaves");
        IReadOnlyList<string> platform = ReadApplySaasStringArray(repoRoot, "$platformWaveLeaves");
        IReadOnlyList<string> app = ReadApplySaasStringArray(repoRoot, "$appWaveLeaves");
        IReadOnlyList<string> hosted = ReadApplySaasHostedWaveLeaves(repoRoot);

        hosted.Should().Equal(foundation.Concat(platform).Concat(app));
    }

    [Fact]
    public void DefaultApplyOrderRoots_orchestrator_line_cites_legacy_leaf_roots_annotation()
    {
        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();
        string orchestratorLine = roots.Single(line => line.Contains("infra/terraform-orchestrator", StringComparison.Ordinal));

        orchestratorLine.Should().Contain("-LegacyLeafRoots");
        orchestratorLine.Should().Contain("legacy isolation path only");
    }

    [Fact]
    public void Apply_saas_ps1_legacy_leaf_roots_branch_assigns_multi_root_sequence_not_hosted_wave_leaves()
    {
        string repoRoot = RequireRepositoryRoot();
        string content = File.ReadAllText(Path.Combine(repoRoot, "infra", "apply-saas.ps1"));

        content.Should().Contain("$legacyIsolationPath = $LegacyLeafRoots", "legacy path is explicit operator intent");
        content.Should().MatchRegex(
            @"elseif\s*\(\$legacyIsolationPath\)\s*\{[\s\S]*?\$multiRootSequence",
            "legacy branch must apply the full multi-root sequence including orchestrator");
        content.Should().MatchRegex(
            @"elseif\s*\(\$hostedWavePath\)\s*\{[\s\S]*?\$hostedWaveLeaves",
            "hosted -MultiRoot branch must omit orchestrator via wave flatten");
    }

    [Fact]
    public void ReadApplySaasHostedWaveLeaves_concatenation_equals_multi_root_sequence_minus_orchestrator()
    {
        string repoRoot = RequireRepositoryRoot();
        IReadOnlyList<string> multiRoot = ReadApplySaasStringArray(repoRoot, "$multiRootSequence");
        IReadOnlyList<string> hostedWaves = ReadApplySaasHostedWaveLeaves(repoRoot);
        List<string> expectedHosted = multiRoot
            .Where(path => !string.Equals(path, "infra/terraform-orchestrator", StringComparison.Ordinal))
            .ToList();

        hostedWaves.Should().Equal(expectedHosted);
    }

    [Fact]
    public void ExtractLeafPaths_includes_orchestrator_while_hosted_wave_parity_excludes_it()
    {
        string repoRoot = RequireRepositoryRoot();
        List<string> evidenceLeaves = ExtractLeafPaths(DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots());
        IReadOnlyList<string> applySaasHostedWaves = ReadApplySaasHostedWaveLeaves(repoRoot);

        evidenceLeaves.Should().Contain("infra/terraform-orchestrator");
        evidenceLeaves
            .Where(path => !string.Equals(path, "infra/terraform-orchestrator", StringComparison.Ordinal))
            .Should()
            .Equal(applySaasHostedWaves);
    }

    [Fact]
    public void ExtractLeafPaths_splits_only_on_first_em_dash_for_annotated_lines()
    {
        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();

        foreach (string line in roots)
        {
            if (!line.Contains(" —", StringComparison.Ordinal))
                continue;

            string path = line.Split(" —", 2, StringSplitOptions.None)[0].Trim();

            path.Should().StartWith("infra/");
            path.Should().NotContain(" —", "path segment must not contain em-dash; delimiter separates path from annotation only");
        }
    }

    [Fact]
    public void DefaultApplyOrderRoots_composition_wave_annotations_are_separate_from_pilot_leaf_path_order()
    {
        string repoRoot = RequireRepositoryRoot();
        IReadOnlyList<string> pilotLeaves = ReadTerraformPilotNestedInfrastructureRootPaths(repoRoot);
        IReadOnlyList<string> evidenceComposition = ExtractCompositionRootPaths(
            DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots());

        evidenceComposition.Should().Equal(ReadTerraformPilotCompositionRootPaths(repoRoot));
        pilotLeaves.Should().Equal(ExtractLeafPaths(DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots()));
        evidenceComposition.Should().NotEqual(pilotLeaves.Take(3).ToList());
    }

    [Fact]
    public void DefaultApplyOrderRoots_leaf_sequence_matches_terraform_pilot_nested_infrastructure_roots()
    {
        string repoRoot = RequireRepositoryRoot();
        IReadOnlyList<string> pilotLeaves = ReadTerraformPilotNestedInfrastructureRootPaths(repoRoot);
        IReadOnlyList<string> evidenceLeaves = ExtractLeafPaths(DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots());

        evidenceLeaves.Should().Equal(pilotLeaves);
    }

    [Fact]
    public void DefaultApplyOrderRoots_annotated_lines_use_em_dash_path_delimiter()
    {
        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();

        foreach (string line in roots)
        {
            if (!line.Contains("metadata composition root", StringComparison.Ordinal)
                && !line.Contains("canonical default profile", StringComparison.Ordinal)
                && !line.Contains("legacy isolation path only", StringComparison.Ordinal))
            {
                continue;
            }

            line.Should().Contain(" —", "annotated evidence lines must split on em dash for path extraction");
        }
    }

    [Fact]
    public void DefaultApplyOrderRoots_contains_no_duplicate_paths()
    {
        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();
        List<string> paths = roots
            .Select(line => line.Split(" —", 2, StringSplitOptions.None)[0].Trim())
            .ToList();

        paths.Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public void DefaultApplyOrderRoots_all_paths_start_with_infra_prefix()
    {
        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();

        foreach (string line in roots)
        {
            string path = line.Split(" —", 2, StringSplitOptions.None)[0].Trim();
            path.Should().StartWith("infra/", "evidence paths must stay repo-relative under infra/");
        }
    }

    [Fact]
    public void DefaultApplyOrderRoots_every_listed_root_directory_exists_on_disk()
    {
        string repoRoot = RequireRepositoryRoot();

        foreach (string path in ExtractAllPaths(DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots()))
        {
            Directory.Exists(Path.Combine(repoRoot, path))
                .Should()
                .BeTrue($"deployment evidence must reference an on-disk Terraform root at {path}");
        }
    }

    [Fact]
    public void DefaultApplyOrderRoots_composition_roots_match_terraform_pilot_root_path_order()
    {
        string repoRoot = RequireRepositoryRoot();
        IReadOnlyList<string> pilotComposition = ReadTerraformPilotCompositionRootPaths(repoRoot);
        IReadOnlyList<string> evidenceComposition = ExtractCompositionRootPaths(
            DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots());

        evidenceComposition.Should().Equal(pilotComposition);
    }

    [Fact]
    public void DefaultApplyOrderRoots_returns_equal_lists_on_repeated_calls()
    {
        IReadOnlyList<string> first = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();
        IReadOnlyList<string> second = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();

        second.Should().Equal(first);
    }

    [Fact]
    public void DocumentationRelativePath_uses_docs_library_relative_forward_slashes()
    {
        DeploymentEvidenceTerraformReference.DocumentationRelativePath
            .Should()
            .Be("docs/library/REFERENCE_SAAS_STACK_ORDER.md");
        DeploymentEvidenceTerraformReference.DocumentationRelativePath
            .Should()
            .NotContain("\\");
    }

    [Fact]
    public void DefaultApplyOrderRoots_lists_exactly_twenty_entries()
    {
        DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots().Should().HaveCount(20);
    }

    [Fact]
    public void DefaultApplyOrderRoots_places_pilot_as_final_entry()
    {
        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();

        roots[^1].Should().Contain("infra/terraform-pilot");
    }

    [Fact]
    public void DefaultApplyOrderRoots_lists_three_composition_waves_in_foundation_platform_app_order()
    {
        IReadOnlyList<string> composition = ExtractCompositionRootPaths(
            DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots());

        composition.Should().Equal(
        [
            "infra/terraform-foundation",
            "infra/terraform-platform",
            "infra/terraform-app",
        ]);
    }

    [Fact]
    public void DocumentationRelativePath_does_not_use_leading_slash()
    {
        DeploymentEvidenceTerraformReference.DocumentationRelativePath
            .Should()
            .NotStartWith("/");
    }

    [Fact]
    public void DefaultApplyOrderRoots_lists_orchestrator_only_once_as_legacy_leaf()
    {
        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();
        List<string> orchestratorLines = roots
            .Where(line => line.Contains("infra/terraform-orchestrator", StringComparison.Ordinal))
            .ToList();

        orchestratorLines.Should().ContainSingle();
        orchestratorLines[0].Should().Contain("legacy isolation path only");
    }

    [Fact]
    public void DefaultApplyOrderRoots_leaf_sequence_matches_reference_doc_advanced_table()
    {
        string repoRoot = RequireRepositoryRoot();
        IReadOnlyList<string> referenceLeaves = ReadReferenceDocAdvancedTableLeafPaths(repoRoot);
        IReadOnlyList<string> evidenceLeaves = ExtractLeafPaths(DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots());

        evidenceLeaves.Should().Equal(referenceLeaves);
    }

    [Fact]
    public void DefaultApplyOrderRoots_composition_roots_annotate_foundation_platform_app_waves()
    {
        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();
        List<string> compositionLines = roots
            .Where(line => line.Contains("metadata composition root", StringComparison.Ordinal))
            .ToList();

        compositionLines.Should().HaveCount(3);
        compositionLines[0].Should().Contain("wave 1");
        compositionLines[1].Should().Contain("wave 2");
        compositionLines[2].Should().Contain("wave 3");
    }

    [Fact]
    public void DefaultApplyOrderRoots_hosted_wave_boundaries_place_app_leaves_after_platform_leaves()
    {
        List<string> leaves = ExtractLeafPaths(DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots());

        leaves.IndexOf("infra/terraform-acr").Should().BeGreaterThan(leaves.IndexOf("infra/terraform-keyvault"));
        leaves.IndexOf("infra/terraform-entra").Should().BeGreaterThan(leaves.IndexOf("infra/terraform-acr"));
    }

    [Fact]
    public void DefaultApplyOrderRoots_plain_leaf_lines_are_unannotated_exact_paths()
    {
        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();

        foreach (string line in roots)
        {
            if (line.Contains("metadata composition root", StringComparison.Ordinal)
                || line.Contains("canonical default profile", StringComparison.Ordinal)
                || line.Contains("legacy isolation path only", StringComparison.Ordinal))
            {
                continue;
            }

            line.Should().NotContain(" —", "plain leaf lines must not use em-dash annotations that corrupt path extraction");
            line.Should().StartWith("infra/");
            line.Trim().Should().Be(line, "plain leaf lines must be exact paths without trailing whitespace");
        }
    }

    [Fact]
    public void DefaultApplyOrderRoots_consumption_apim_root_follows_edge_and_precedes_monitoring()
    {
        List<string> leaves = ExtractLeafPaths(DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots());

        leaves.IndexOf("infra/terraform").Should().BeGreaterThan(leaves.IndexOf("infra/terraform-edge"));
        leaves.IndexOf("infra/terraform-monitoring").Should().BeGreaterThan(leaves.IndexOf("infra/terraform"));
    }

    [Fact]
    public void DefaultApplyOrderRoots_leaf_order_differs_from_lexicographic_sort_of_paths()
    {
        List<string> leaves = ExtractLeafPaths(DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots());
        List<string> lexicographic = leaves.OrderBy(leaf => leaf, StringComparer.Ordinal).ToList();

        lexicographic.Should().NotEqual(leaves, "hosted apply order is authoritative sequence, not sorted paths");
        leaves.IndexOf("infra/terraform").Should().BeLessThan(leaves.IndexOf("infra/terraform-monitoring"));
        leaves.IndexOf("infra/terraform-private").Should().BeLessThan(leaves.IndexOf("infra/terraform-keyvault"));
    }

    [Fact]
    public void DefaultApplyOrderRoots_reference_doc_advanced_table_lists_exactly_sixteen_leaves()
    {
        string repoRoot = RequireRepositoryRoot();
        IReadOnlyList<string> referenceLeaves = ReadReferenceDocAdvancedTableLeafPaths(repoRoot);

        referenceLeaves.Should().HaveCount(16);
        referenceLeaves.Should().Equal(ExtractLeafPaths(DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots()));
    }

    [Fact]
    public void Reference_doc_advanced_table_path_cells_use_backtick_wrappers()
    {
        string repoRoot = RequireRepositoryRoot();
        string docPath = Path.Combine(repoRoot, DeploymentEvidenceTerraformReference.DocumentationRelativePath);
        string content = File.ReadAllText(docPath);
        MatchCollection backtickPaths = Regex.Matches(
            content,
            @"^\|\s*\d+\s*\|\s*`(infra/[^`]+)`\s*\|",
            RegexOptions.Multiline);

        backtickPaths.Should().HaveCount(16);
    }

    [Fact]
    public void Reference_doc_advanced_table_row_numbers_are_contiguous_one_through_sixteen()
    {
        string repoRoot = RequireRepositoryRoot();
        string docPath = Path.Combine(repoRoot, DeploymentEvidenceTerraformReference.DocumentationRelativePath);
        string content = File.ReadAllText(docPath);
        MatchCollection rowNumbers = Regex.Matches(
            content,
            @"^\|\s*(\d+)\s*\|\s*`infra/",
            RegexOptions.Multiline);

        List<int> indices = rowNumbers
            .Select(match => int.Parse(match.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture))
            .ToList();

        indices.Should().Equal(Enumerable.Range(1, 16));
    }

    [Fact]
    public void Referenced_terraform_root_directories_match_python_ordering_guard_scope()
    {
        string repoRoot = RequireRepositoryRoot();
        IReadOnlyList<string> pilotLeaves = ReadTerraformPilotNestedInfrastructureRootPaths(repoRoot);
        IReadOnlyList<string> applyLeaves = ReadApplySaasStringArray(repoRoot, "$multiRootSequence");
        IReadOnlyList<string> pilotComposition = ReadTerraformPilotCompositionRootPaths(repoRoot);

        HashSet<string> referenced = pilotLeaves
            .Concat(applyLeaves)
            .Concat(pilotComposition)
            .ToHashSet(StringComparer.Ordinal);

        foreach (string rel in referenced.OrderBy(path => path, StringComparer.Ordinal))
        {
            Directory.Exists(Path.Combine(repoRoot, rel))
                .Should()
                .BeTrue($"python ordering guard requires on-disk directory for {rel}");
        }

        HashSet<string> evidencePaths = ExtractAllPaths(DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots())
            .ToHashSet(StringComparer.Ordinal);

        referenced.Should().BeSubsetOf(evidencePaths);
    }

    [Fact]
    public void DefaultApplyOrderRoots_hardcoded_leaf_fixture_matches_live_apply_saas_multiRootSequence()
    {
        string repoRoot = RequireRepositoryRoot();
        IReadOnlyList<string> liveLeaves = ReadApplySaasStringArray(repoRoot, "$multiRootSequence");
        List<string> hardcodedFixtureLeaves = ExtractLeafPaths(DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots());

        hardcodedFixtureLeaves.Should().Equal(liveLeaves);
    }

    [Fact]
    public void DefaultApplyOrderRoots_hardcoded_leaf_array_matches_ExtractLeafPaths_helper()
    {
        string[] expectedLeafPaths =
        [
            "infra/terraform-private",
            "infra/terraform-keyvault",
            "infra/terraform-sql-failover",
            "infra/terraform-storage",
            "infra/terraform-redis",
            "infra/terraform-cosmos",
            "infra/terraform-servicebus",
            "infra/terraform-logicapps",
            "infra/terraform-openai",
            "infra/terraform-acr",
            "infra/terraform-entra",
            "infra/terraform-container-apps",
            "infra/terraform-edge",
            "infra/terraform",
            "infra/terraform-monitoring",
            "infra/terraform-orchestrator",
        ];

        ExtractLeafPaths(DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots())
            .Should()
            .Equal(expectedLeafPaths);
    }

    [Fact]
    public void DefaultApplyOrderRoots_hosted_wave_partitions_match_apply_saas_ps1_wave_arrays()
    {
        string repoRoot = RequireRepositoryRoot();
        IReadOnlyList<string> foundation = ReadApplySaasStringArray(repoRoot, "$foundationWaveLeaves");
        IReadOnlyList<string> platform = ReadApplySaasStringArray(repoRoot, "$platformWaveLeaves");
        IReadOnlyList<string> app = ReadApplySaasStringArray(repoRoot, "$appWaveLeaves");
        List<string> hostedLeaves = ExtractLeafPaths(DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots())
            .Where(path => !string.Equals(path, "infra/terraform-orchestrator", StringComparison.Ordinal))
            .ToList();

        hostedLeaves.Take(foundation.Count).Should().Equal(foundation);
        hostedLeaves.Skip(foundation.Count).Take(platform.Count).Should().Equal(platform);
        hostedLeaves.Skip(foundation.Count + platform.Count).Should().Equal(app);
    }

    [Fact]
    public void Apply_saas_ps1_multiRootSequence_entries_use_double_quoted_string_literals()
    {
        string repoRoot = RequireRepositoryRoot();
        IReadOnlyList<string> parsed = ReadApplySaasStringArray(repoRoot, "$multiRootSequence");

        parsed.Should().HaveCount(16);

        string applySaasPath = Path.Combine(repoRoot, "infra", "apply-saas.ps1");
        string[] lines = File.ReadAllLines(applySaasPath);
        int markerLine = Array.FindIndex(
            lines,
            line => line.Contains("$multiRootSequence = @(", StringComparison.Ordinal));

        markerLine.Should().BeGreaterThanOrEqualTo(0);

        Regex doubleQuotedLeaf = new(@"^\s*""(infra/[^""]+)""\s*,?\s*$");

        for (int i = markerLine + 1; i < lines.Length; i++)
        {
            string line = lines[i].Trim();

            if (line.StartsWith(')'))
                break;

            if (line.Length == 0)
                continue;

            doubleQuotedLeaf.IsMatch(line).Should().BeTrue($"expected double-quoted leaf line, got: {line}");
        }
    }

    [Fact]
    public void Reference_doc_advanced_table_documents_orchestrator_as_legacy_only_multi_root_row()
    {
        string repoRoot = RequireRepositoryRoot();
        string docPath = Path.Combine(repoRoot, DeploymentEvidenceTerraformReference.DocumentationRelativePath);
        string content = File.ReadAllText(docPath);

        content.Should().Contain("| 16 | `infra/terraform-orchestrator`");
        content.Should().Contain("legacy-only");
        content.Should().Contain("omitted from hosted `-MultiRoot`");
    }

    [Fact]
    public void DefaultApplyOrderRoots_pilot_profile_entry_documents_metadata_only_default_profile()
    {
        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();
        string pilotLine = roots.Single(line => line.Contains("infra/terraform-pilot", StringComparison.Ordinal));

        pilotLine.Should().Contain("canonical default profile");
        pilotLine.Should().Contain("no Azure apply");
    }

    [Fact]
    public void DefaultApplyOrderRoots_composition_metadata_lines_cite_no_azure_apply()
    {
        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();
        List<string> compositionLines = roots
            .Where(line => line.Contains("metadata composition root", StringComparison.Ordinal))
            .ToList();

        compositionLines.Should().HaveCount(3);

        foreach (string line in compositionLines)
        {
            line.Should().Contain("no Azure apply", "composition roots are metadata-only per REFERENCE_SAAS_STACK_ORDER.md");
        }
    }

    [Fact]
    public void DefaultApplyOrderRoots_index_helper_distinguishes_consumption_apim_from_monitoring_path()
    {
        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();

        int terraformIndex = IndexOfPath(roots, "infra/terraform");
        int monitoringIndex = IndexOfPath(roots, "infra/terraform-monitoring");

        terraformIndex.Should().BeGreaterThanOrEqualTo(0);
        monitoringIndex.Should().BeGreaterThan(terraformIndex);
    }

    private static string RequireRepositoryRoot()
    {
        string? repoRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot(AppContext.BaseDirectory);

        repoRoot.Should().NotBeNullOrWhiteSpace();

        return repoRoot!;
    }

    private static IReadOnlyList<string> ReadApplySaasStringArray(string repoRoot, string marker)
    {
        string applySaasPath = Path.Combine(repoRoot, "infra", "apply-saas.ps1");
        string content = File.ReadAllText(applySaasPath);

        return ParsePowerShellStringArray(content, marker);
    }

    private static IReadOnlyList<string> ReadApplySaasHostedWaveLeaves(string repoRoot)
    {
        IReadOnlyList<string> foundation = ReadApplySaasStringArray(repoRoot, "$foundationWaveLeaves");
        IReadOnlyList<string> platform = ReadApplySaasStringArray(repoRoot, "$platformWaveLeaves");
        IReadOnlyList<string> app = ReadApplySaasStringArray(repoRoot, "$appWaveLeaves");

        return foundation.Concat(platform).Concat(app).ToList();
    }

    private static IReadOnlyList<string> ReadTerraformPilotNestedInfrastructureRootPaths(string repoRoot)
    {
        string pilotMainTfPath = Path.Combine(repoRoot, "infra", "terraform-pilot", "main.tf");
        string content = File.ReadAllText(pilotMainTfPath);
        MatchCollection matches = Regex.Matches(
            content,
            @"^\s+path\s*=\s*""(infra/terraform[^""]*)""\s*$",
            RegexOptions.Multiline);

        return matches.Select(match => match.Groups[1].Value).ToList();
    }

    private static IReadOnlyList<string> ReadTerraformPilotCompositionRootPaths(string repoRoot)
    {
        string pilotMainTfPath = Path.Combine(repoRoot, "infra", "terraform-pilot", "main.tf");
        string content = File.ReadAllText(pilotMainTfPath);
        MatchCollection matches = Regex.Matches(
            content,
            @"^\s+root_path\s*=\s*""(infra/terraform[^""]*)""\s*$",
            RegexOptions.Multiline);

        return matches.Select(match => match.Groups[1].Value).ToList();
    }

    private static IReadOnlyList<string> ReadReferenceDocAdvancedTableLeafPaths(string repoRoot)
    {
        string docPath = Path.Combine(repoRoot, DeploymentEvidenceTerraformReference.DocumentationRelativePath);
        string content = File.ReadAllText(docPath);
        MatchCollection matches = Regex.Matches(
            content,
            @"^\|\s*\d+\s*\|\s*`(infra/[^`]+)`\s*\|",
            RegexOptions.Multiline);

        return matches.Select(match => match.Groups[1].Value).ToList();
    }

    private static List<string> ExtractAllPaths(IReadOnlyList<string> roots)
    {
        return roots
            .Select(line => line.Split(" —", 2, StringSplitOptions.None)[0].Trim())
            .ToList();
    }

    private static List<string> ParsePowerShellStringArray(string content, string marker)
    {
        string[] lines = content.Split('\n');
        int start = -1;

        for (int i = 0; i < lines.Length; i++)
        {
            if (lines[i].Contains(marker, StringComparison.Ordinal) && lines[i].Contains("@(", StringComparison.Ordinal))
            {
                start = i + 1;
                break;
            }
        }

        if (start < 0)
            throw new InvalidOperationException($"Could not find PowerShell array for marker {marker}.");

        List<string> values = [];
        Regex quoted = new(@"^""([^""]+)""\s*,?\s*$");

        for (int i = start; i < lines.Length; i++)
        {
            string line = lines[i].Trim();

            if (line.StartsWith(')'))
                break;

            Match match = quoted.Match(line);

            if (match.Success)
                values.Add(match.Groups[1].Value);
        }

        return values;
    }

    private static List<string> ExtractLeafPaths(IReadOnlyList<string> roots)
    {
        return roots
            .Where(line => !line.Contains("metadata composition root", StringComparison.Ordinal)
                && !line.Contains("canonical default profile", StringComparison.Ordinal))
            .Select(line => line.Split(" —", 2, StringSplitOptions.None)[0].Trim())
            .ToList();
    }

    private static List<string> ExtractCompositionRootPaths(IReadOnlyList<string> roots)
    {
        return roots
            .Where(line => line.Contains("metadata composition root", StringComparison.Ordinal))
            .Select(line => line.Split(" —", 2, StringSplitOptions.None)[0].Trim())
            .ToList();
    }

    private static List<string> ExtractDefaultPilotProfilePaths(IReadOnlyList<string> roots)
    {
        return roots
            .Where(line => line.Contains("canonical default profile", StringComparison.Ordinal))
            .Select(line => line.Split(" —", 2, StringSplitOptions.None)[0].Trim())
            .ToList();
    }

    private static int IndexOfPath(IReadOnlyList<string> roots, string path)
    {
        for (int i = 0; i < roots.Count; i++)
        {
            string linePath = roots[i].Split(" —", 2, StringSplitOptions.None)[0].Trim();

            if (string.Equals(linePath, path, StringComparison.Ordinal))
            {
                return i;
            }
        }

        return -1;
    }
}
