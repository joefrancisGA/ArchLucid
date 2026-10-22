using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ReviewCacheManifestBuilderTests
{
    [Fact]
    public void Build_changes_content_hash_when_source_text_changes()
    {
        ClosedLoopReasoningRequest baseline = CreateRequest("Public API without auth.");
        ClosedLoopReasoningRequest changed = CreateRequest("Public API without auth. Added billing worker.");

        ReviewCacheDependencyManifest hashA = ReviewCacheManifestBuilder.Build(baseline);
        ReviewCacheDependencyManifest hashB = ReviewCacheManifestBuilder.Build(changed);

        hashA.ContentHash.Should().NotBe(hashB.ContentHash);
        hashA.PromptVersion.Should().Be(hashB.PromptVersion);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_changes_and_client_run_id_is_blank()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = null;

        ArchitectureKnowledgeModel baseline = new()
        {
            ModelId = "model-1",
            RunId = "run-generated",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel changed = new()
        {
            ModelId = "model-1",
            RunId = "run-generated",
            Elements =
            [
                new ArchitectureModelElement { ElementId = "el-1", Name = "API" },
                new ArchitectureModelElement { ElementId = "el-2", Name = "Worker" },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, baseline).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, changed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_tenant_id_differs_only_by_surrounding_whitespace()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-tenant-trim";

        ArchitectureKnowledgeModel paddedTenant = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            TenantId = "  tenant-cache  ",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel trimmedTenant = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            TenantId = "tenant-cache",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, paddedTenant).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, trimmedTenant).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_framing_answer_differs_only_by_unicode_normalization_form()
    {
        const string nfcAnswer = "Secure claims intake with Caf\u00E9.";
        const string nfdAnswer = "Secure claims intake with Cafe\u0301.";

        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-framing-unicode";

        ArchitectureKnowledgeModel nfcModel = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["business-outcome"] = nfcAnswer },
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel nfdModel = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["business-outcome"] = nfdAnswer },
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, nfcModel).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, nfdModel).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_elements_include_duplicate_normalized_element_ids()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-duplicate-element-id";

        ArchitectureKnowledgeModel duplicateIds = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement { ElementId = "el-1", Name = "API" },
                new ArchitectureModelElement { ElementId = "  el-1  ", Name = "API" },
            ],
        };

        ArchitectureKnowledgeModel singleId = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, duplicateIds).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, singleId).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_declared_priorities_are_whitespace_only_vs_empty_list()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-declared-priority-whitespace";

        ArchitectureKnowledgeModel whitespaceOnly = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            DeclaredPriorities = ["   "],
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel emptyList = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            DeclaredPriorities = [],
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, whitespaceOnly).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, emptyList).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_id_differs_only_by_surrounding_whitespace()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-id-trim";

        ArchitectureKnowledgeModel paddedId = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "  el-1  ", Name = "API" }],
        };

        ArchitectureKnowledgeModel trimmedId = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, paddedId).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, trimmedId).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_related_element_ids_include_duplicates_after_normalization()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-related-id-dedupe";

        ArchitectureKnowledgeModel duplicateRelated = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    RelatedElementIds = ["el-2", "el-2", "  el-2  "],
                },
            ],
        };

        ArchitectureKnowledgeModel canonicalRelated = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    RelatedElementIds = ["el-2"],
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, duplicateRelated).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, canonicalRelated).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_related_element_ids_differ_only_by_surrounding_whitespace()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-related-id-trim";

        ArchitectureKnowledgeModel paddedRelated = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    RelatedElementIds = ["  el-2  "],
                },
            ],
        };

        ArchitectureKnowledgeModel trimmedRelated = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    RelatedElementIds = ["el-2"],
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, paddedRelated).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, trimmedRelated).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_source_passage_ids_include_duplicates_after_normalization()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-id-dedupe";

        ArchitectureKnowledgeModel duplicatePassages = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    SourcePassageIds = ["passage-1", "passage-1", "  passage-1  "],
                },
            ],
        };

        ArchitectureKnowledgeModel canonicalPassages = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    SourcePassageIds = ["passage-1"],
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, duplicatePassages).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, canonicalPassages).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_source_passage_ids_differ_only_by_surrounding_whitespace()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-id-trim";

        ArchitectureKnowledgeModel paddedPassages = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    SourcePassageIds = ["  passage-1  "],
                },
            ],
        };

        ArchitectureKnowledgeModel trimmedPassages = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    SourcePassageIds = ["passage-1"],
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, paddedPassages).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, trimmedPassages).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_properties_include_duplicate_keys_after_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-property-key-casing";

        ArchitectureKnowledgeModel mixedCase = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string>
                    {
                        ["Environment"] = "prod",
                        ["environment"] = "prod",
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel canonical = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["Environment"] = "prod" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, mixedCase).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, canonical).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_properties_include_duplicate_keys_after_normalization()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-property-key-dedupe";

        ArchitectureKnowledgeModel duplicateKeys = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string>
                    {
                        ["  env  "] = "prod",
                        ["env"] = "prod",
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel canonicalKeys = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["env"] = "prod" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, duplicateKeys).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, canonicalKeys).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_narrow_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest spaced = CreateRequest("Same body.");
        spaced.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch note.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest narrow = CreateRequest("ignored");
        narrow.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch\u202Fnote.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(narrow).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_property_value_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-property-value-nbsp";

        ArchitectureKnowledgeModel spaced = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["env"] = "prod tier" },
                },
            ],
        };

        ArchitectureKnowledgeModel nbsp = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["env"] = "prod\u00A0tier" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, nbsp).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_duplicate_element_ids_pick_canonical_row_by_name_order()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-duplicate-element-canonical";

        ArchitectureKnowledgeModel reversedOrder = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement { ElementId = "el-1", Name = "Worker" },
                new ArchitectureModelElement { ElementId = "el-1", Name = "API" },
            ],
        };

        ArchitectureKnowledgeModel canonical = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, reversedOrder).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, canonical).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest spaced = CreateRequest("Same body.");
        spaced.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch note.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest nbsp = CreateRequest("ignored");
        nbsp.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch\u00A0note.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nbsp).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_property_value_differs_only_by_surrounding_whitespace()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-property-trim";

        ArchitectureKnowledgeModel paddedProperty = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["tier"] = "  public  " },
                },
            ],
        };

        ArchitectureKnowledgeModel trimmedProperty = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["tier"] = "public" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, paddedProperty).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, trimmedProperty).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_name_differs_only_by_surrounding_whitespace()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-trim";

        ArchitectureKnowledgeModel paddedName = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "  API  " }],
        };

        ArchitectureKnowledgeModel trimmedName = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, paddedName).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, trimmedName).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_name_differs_only_by_unicode_normalization_form()
    {
        const string nfcName = "Claims Caf\u00E9 API";
        const string nfdName = "Claims Cafe\u0301 API";

        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-name-unicode";

        ArchitectureKnowledgeModel nfcModel = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = nfcName }],
        };

        ArchitectureKnowledgeModel nfdModel = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = nfdName }],
        };

        ReviewCacheManifestBuilder.Build(request, nfcModel).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, nfdModel).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_declared_priorities_differ_only_by_unicode_normalization_form()
    {
        const string nfcPriority = "Caf\u00E9";
        const string nfdPriority = "Cafe\u0301";

        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-declared-priority-unicode";

        ArchitectureKnowledgeModel nfcModel = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            DeclaredPriorities = [nfcPriority],
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel nfdModel = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            DeclaredPriorities = [nfdPriority],
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, nfcModel).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, nfdModel).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_notes_differ_only_by_unicode_normalization_form()
    {
        const string nfcNotes = "Cited from Caf\u00E9 runbook.";
        const string nfdNotes = "Cited from Cafe\u0301 runbook.";

        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-provenance-notes-unicode";

        ArchitectureKnowledgeModel nfcModel = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Notes = nfcNotes },
                },
            ],
        };

        ArchitectureKnowledgeModel nfdModel = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Notes = nfdNotes },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, nfcModel).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, nfdModel).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_declared_priorities_differ_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-declared-priority-casing";

        ArchitectureKnowledgeModel mixedCase = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            DeclaredPriorities = ["Security", "security"],
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel canonical = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            DeclaredPriorities = ["Security"],
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, mixedCase).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, canonical).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_declared_priorities_differ_only_by_surrounding_whitespace()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-declared-priority-trim";

        ArchitectureKnowledgeModel padded = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            DeclaredPriorities = ["  Security  "],
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel trimmed = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            DeclaredPriorities = ["Security"],
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, padded).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, trimmed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_locator_artifact_id_differs_only_by_surrounding_whitespace()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-artifact-trim";

        ArchitectureKnowledgeModel padded = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance
                    {
                        PassageLocator = new SourcePassageLocator { ArtifactId = "  artifact-1  " },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel trimmed = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance
                    {
                        PassageLocator = new SourcePassageLocator { ArtifactId = "artifact-1" },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, padded).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, trimmed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_id_is_whitespace_only_vs_empty_string()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-id-whitespace";

        ArchitectureKnowledgeModel whitespaceId = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "   ", Name = "API" }],
        };

        ArchitectureKnowledgeModel emptyId = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = string.Empty, Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, whitespaceId).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, emptyId).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_quote_differs_only_by_unicode_normalization_form()
    {
        const string nfcQuote = "Claims Caf\u00E9 intake.";
        const string nfdQuote = "Claims Cafe\u0301 intake.";

        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-quote-unicode";

        ArchitectureKnowledgeModel nfcModel = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance
                    {
                        PassageLocator = new SourcePassageLocator { Quote = nfcQuote },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel nfdModel = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance
                    {
                        PassageLocator = new SourcePassageLocator { Quote = nfdQuote },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, nfcModel).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, nfdModel).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_source_artifact_id_differs_only_by_surrounding_whitespace()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-provenance-trim";

        ArchitectureKnowledgeModel paddedArtifact = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SourceArtifactId = "  artifact-1  " },
                },
            ],
        };

        ArchitectureKnowledgeModel trimmedArtifact = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SourceArtifactId = "artifact-1" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, paddedArtifact).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, trimmedArtifact).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_description_differs_only_by_unicode_normalization_form()
    {
        const string nfcDescription = "Handles Caf\u00E9 traffic.";
        const string nfdDescription = "Handles Cafe\u0301 traffic.";

        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-description-unicode";

        ArchitectureKnowledgeModel nfcModel = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API", Description = nfcDescription }],
        };

        ArchitectureKnowledgeModel nfdModel = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API", Description = nfdDescription }],
        };

        ReviewCacheManifestBuilder.Build(request, nfcModel).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, nfdModel).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_baseline_model_fingerprint_changes_for_supplied_run_id()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-with-model";

        ArchitectureKnowledgeModel baseline = new()
        {
            ModelId = "model-1",
            RunId = "run-with-model",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel changed = new()
        {
            ModelId = "model-1",
            RunId = "run-with-model",
            Elements =
            [
                new ArchitectureModelElement { ElementId = "el-1", Name = "API" },
                new ArchitectureModelElement { ElementId = "el-2", Name = "Worker" },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, baseline).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(request, changed).ContentHash);
    }

    [Fact]
    public void Build_changes_hash_when_declared_priorities_change()
    {
        ClosedLoopReasoningRequest security = CreateRequest("Architecture note.");
        security.DeclaredPriorities = ["Security"];

        ClosedLoopReasoningRequest cost = CreateRequest("Architecture note.");
        cost.DeclaredPriorities = ["Cost"];

        ReviewCacheManifestBuilder.Build(security).DeclaredPrioritiesHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(cost).DeclaredPrioritiesHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_client_run_id_is_whitespace_only_vs_omitted()
    {
        ClosedLoopReasoningRequest omitted = CreateRequest("Architecture note.");

        ClosedLoopReasoningRequest whitespace = CreateRequest("Architecture note.");
        whitespace.RunId = "   ";

        ReviewCacheManifestBuilder.Build(omitted).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(whitespace).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_baseline_model_loads_for_same_client_run_id()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-first-persist";

        ArchitectureKnowledgeModel persisted = new()
        {
            ModelId = "model-1",
            RunId = "run-first-persist",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, baselineKnowledgeModel: null).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(request, persisted).ContentHash);
    }

    [Fact]
    public void Build_matches_declared_priorities_hash_when_entries_differ_only_by_casing()
    {
        ClosedLoopReasoningRequest mixedCase = CreateRequest("Architecture note.");
        mixedCase.DeclaredPriorities = ["Security", "security"];

        ClosedLoopReasoningRequest canonical = CreateRequest("Architecture note.");
        canonical.DeclaredPriorities = ["Security"];

        ReviewCacheManifestBuilder.Build(mixedCase).DeclaredPrioritiesHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(canonical).DeclaredPrioritiesHash);
    }

    [Fact]
    public void Build_matches_declared_priorities_hash_when_priority_differs_only_by_unicode_normalization_form()
    {
        const string nfcPriority = "Caf\u00E9";
        const string nfdPriority = "Cafe\u0301";

        ClosedLoopReasoningRequest nfcRequest = CreateRequest("Architecture note.");
        nfcRequest.DeclaredPriorities = [nfcPriority];

        ClosedLoopReasoningRequest nfdRequest = CreateRequest("Architecture note.");
        nfdRequest.DeclaredPriorities = [nfdPriority];

        ReviewCacheManifestBuilder.Build(nfcRequest).DeclaredPrioritiesHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nfdRequest).DeclaredPrioritiesHash);
    }

    [Fact]
    public void Build_ignores_publish_intent_for_content_hash()
    {
        ClosedLoopReasoningRequest withoutPublish = CreateRequest("Architecture note.");
        withoutPublish.PublishToProduct = false;

        ClosedLoopReasoningRequest withPublish = CreateRequest("Architecture note.");
        withPublish.PublishToProduct = true;

        ReviewCacheManifestBuilder.Build(withoutPublish).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(withPublish).ContentHash);
    }

    [Fact]
    public void Build_changes_hash_when_model_alias_changes()
    {
        ClosedLoopReasoningRequest baseline = CreateRequest("Architecture note.");
        baseline.ModelAliasId = "alias-a";

        ClosedLoopReasoningRequest changed = CreateRequest("Architecture note.");
        changed.ModelAliasId = "alias-b";

        ReviewCacheManifestBuilder.Build(baseline).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(changed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_model_alias_is_null_vs_empty_string()
    {
        ClosedLoopReasoningRequest withoutAlias = CreateRequest("Architecture note.");

        ClosedLoopReasoningRequest emptyAlias = CreateRequest("Architecture note.");
        emptyAlias.ModelAliasId = string.Empty;

        ReviewCacheManifestBuilder.Build(withoutAlias).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(emptyAlias).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_duplicate_source_texts_normalize_to_identical_rows()
    {
        ClosedLoopReasoningSourceText attachment = new()
        {
            FileName = "arch.md",
            ContentType = "text/markdown",
            Content = "Same body.",
        };

        ClosedLoopReasoningRequest single = CreateRequest("ignored");
        single.SourceTexts = [attachment];

        ClosedLoopReasoningRequest duplicated = CreateRequest("ignored");
        duplicated.SourceTexts = [attachment, attachment];

        ReviewCacheManifestBuilder.Build(single).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(duplicated).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_evidence_ref_differs_only_by_unicode_normalization_form()
    {
        const string nfcRef = "evidence:Caf\u00E9";
        const string nfdRef = "evidence:Cafe\u0301";

        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-evidence-unicode";

        TechnologyLedgerEntry nfcEntry = CreateLedgerEntry(request.RunId, nfcRef);
        TechnologyLedgerEntry nfdEntry = CreateLedgerEntry(request.RunId, nfdRef);

        ReviewCacheManifestBuilder.Build(request, null, [nfcEntry]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [nfdEntry]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_technology_name_differs_only_by_unicode_normalization_form()
    {
        const string nfcName = "Caf\u00E9";
        const string nfdName = "Cafe\u0301";

        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-unicode";

        TechnologyLedgerEntry nfcEntry = new()
        {
            RunId = request.RunId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = nfcName,
            ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Azure,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
        };

        TechnologyLedgerEntry nfdEntry = new()
        {
            RunId = request.RunId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = nfdName,
            ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Azure,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
        };

        ReviewCacheManifestBuilder.Build(request, null, [nfcEntry]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [nfdEntry]).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_duplicate_filename_has_different_content()
    {
        ClosedLoopReasoningRequest firstBody = CreateRequest("Architecture note.");
        firstBody.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "architecture.md",
                ContentType = "text/markdown",
                Content = "Version one.",
            },
            new ClosedLoopReasoningSourceText
            {
                FileName = "architecture.md",
                ContentType = "text/markdown",
                Content = "Version two.",
            },
        ];

        ClosedLoopReasoningRequest secondBody = CreateRequest("Architecture note.");
        secondBody.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "architecture.md",
                ContentType = "text/markdown",
                Content = "Version two.",
            },
            new ClosedLoopReasoningSourceText
            {
                FileName = "architecture.md",
                ContentType = "text/markdown",
                Content = "Version one.",
            },
        ];

        ReviewCacheManifestBuilder.Build(firstBody).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(secondBody).ContentHash);
    }

    [Fact]
    public void Build_changes_hash_when_golden_fixture_flag_changes()
    {
        ClosedLoopReasoningRequest withoutGolden = CreateRequest("Architecture note.");
        withoutGolden.UseGoldenFixture = false;

        ClosedLoopReasoningRequest withGolden = CreateRequest("Architecture note.");
        withGolden.UseGoldenFixture = true;

        ReviewCacheManifestBuilder.Build(withoutGolden).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(withGolden).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_review_tier_changes()
    {
        ClosedLoopReasoningRequest trial = CreateRequest("Architecture note.");
        trial.ReviewTier = ArchitectureIntelligenceReviewTier.Trial;

        ClosedLoopReasoningRequest standard = CreateRequest("Architecture note.");
        standard.ReviewTier = ArchitectureIntelligenceReviewTier.Standard;

        ReviewCacheManifestBuilder.Build(trial).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(standard).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_baseline_ledger_fingerprint_changes_for_supplied_run_id()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-with-ledger";

        TechnologyLedgerEntry awsEntry = new()
        {
            RunId = request.RunId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = "Amazon Web Services",
            ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Aws,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
        };

        TechnologyLedgerEntry azureEntry = new()
        {
            RunId = request.RunId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = "Microsoft Azure",
            ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Azure,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
        };

        ReviewCacheManifestBuilder.Build(request, null, [awsEntry]).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(request, null, [azureEntry]).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_ledger_lock_or_evidence_changes()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-lock";

        TechnologyLedgerEntry unlocked = new()
        {
            RunId = request.RunId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = "Amazon Web Services",
            ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Aws,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
            IsLocked = false,
            EvidenceRef = null,
        };

        TechnologyLedgerEntry locked = new()
        {
            RunId = request.RunId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = "Amazon Web Services",
            ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Aws,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
            IsLocked = true,
            EvidenceRef = "evidence-1",
        };

        ReviewCacheManifestBuilder.Build(request, null, [unlocked]).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(request, null, [locked]).ContentHash);
    }

    [Fact]
    public void Build_emits_ledger_fingerprint_when_run_id_set_even_if_ledger_missing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-without-ledger";

        ReviewCacheManifestBuilder.Build(request, null, null).ContentHash
            .Should()
            .Be(        ReviewCacheManifestBuilder.Build(request, null, []).ContentHash);
    }

    [Fact]
    public void Build_emits_model_fingerprint_when_run_id_set_even_if_model_missing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-without-model";

        ReviewCacheManifestBuilder.Build(request, null).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, new ArchitectureKnowledgeModel()).ContentHash);
    }

    [Fact]
    public void BuildContinueFromExistingRunCoalesceManifest_changes_hash_when_source_text_changes()
    {
        ClosedLoopReasoningRequest baseline = CreateRequest("Public API without auth.");
        ClosedLoopReasoningRequest changed = CreateRequest("Public API without auth. Added billing worker.");

        ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                baseline,
                "tenant-cache",
                "run-continue")
            .ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                changed,
                "tenant-cache",
                "run-continue").ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_file_name_is_null_vs_empty_string()
    {
        ClosedLoopReasoningRequest nullFileName = CreateRequest("Same body.");
        nullFileName.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = null!,
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest emptyFileName = CreateRequest("Same body.");
        emptyFileName.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = string.Empty,
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(nullFileName).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(emptyFileName).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_content_is_whitespace_only_vs_empty_string()
    {
        ClosedLoopReasoningRequest whitespaceOnly = CreateRequest("ignored");
        whitespaceOnly.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown",
                Content = "   \u00a0\t  ",
            },
        ];

        ClosedLoopReasoningRequest emptyContent = CreateRequest("ignored");
        emptyContent.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown",
                Content = string.Empty,
            },
        ];

        ReviewCacheManifestBuilder.Build(whitespaceOnly).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(emptyContent).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_is_null_vs_empty_model()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-baseline-null-vs-empty";

        ReviewCacheManifestBuilder.Build(request, baselineKnowledgeModel: null).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, new ArchitectureKnowledgeModel()).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_technology_name_is_whitespace_only_vs_empty_string()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-ws-name";

        TechnologyLedgerEntry whitespaceName = CreateLedgerEntry(request.RunId, evidenceRef: null);
        whitespaceName.TechnologyName = "   \t  ";

        TechnologyLedgerEntry emptyName = CreateLedgerEntry(request.RunId, evidenceRef: null);
        emptyName.TechnologyName = string.Empty;

        ReviewCacheManifestBuilder.Build(request, null, [whitespaceName]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [emptyName]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_technology_name_differs_only_by_surrounding_whitespace()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-trim-name";

        TechnologyLedgerEntry padded = CreateLedgerEntry(request.RunId, evidenceRef: null);
        padded.TechnologyName = "  Microsoft Azure  ";

        TechnologyLedgerEntry trimmed = CreateLedgerEntry(request.RunId, evidenceRef: null);
        trimmed.TechnologyName = "Microsoft Azure";

        ReviewCacheManifestBuilder.Build(request, null, [padded]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [trimmed]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_entries_with_equal_sort_keys_differ_only_by_list_order()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-ref-order";

        TechnologyLedgerEntry evidenceB = CreateLedgerEntry(request.RunId, evidenceRef: "evidence:b");
        TechnologyLedgerEntry evidenceA = CreateLedgerEntry(request.RunId, evidenceRef: "evidence:a");

        ReviewCacheManifestBuilder.Build(request, null, [evidenceB, evidenceA]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [evidenceA, evidenceB]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_evidence_refs_differ_only_by_padding_that_changes_sort_order()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-ref-sort-padding";

        TechnologyLedgerEntry leadingSpaceBeta = CreateLedgerEntry(request.RunId, evidenceRef: " beta");
        TechnologyLedgerEntry alpha = CreateLedgerEntry(request.RunId, evidenceRef: "Alpha");

        TechnologyLedgerEntry trimmedBeta = CreateLedgerEntry(request.RunId, evidenceRef: "beta");
        TechnologyLedgerEntry alphaTrimmed = CreateLedgerEntry(request.RunId, evidenceRef: "Alpha");

        ReviewCacheManifestBuilder.Build(request, null, [leadingSpaceBeta, alpha]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [alphaTrimmed, trimmedBeta]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_entries_differ_only_by_status_with_equal_prefix_sort_keys()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-status-order";

        TechnologyLedgerEntry chosen = CreateLedgerEntry(request.RunId, evidenceRef: "evidence:shared");
        chosen.Status = TechnologyLedgerStatus.Chosen;

        TechnologyLedgerEntry assumed = CreateLedgerEntry(request.RunId, evidenceRef: "evidence:shared");
        assumed.Status = TechnologyLedgerStatus.Assumed;

        ReviewCacheManifestBuilder.Build(request, null, [chosen, assumed]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [assumed, chosen]).ContentHash);
    }

    [Fact]
    public void Build_matches_declared_priorities_hash_when_duplicate_priorities_differ_only_by_surrounding_whitespace()
    {
        ClosedLoopReasoningRequest padded = CreateRequest("Architecture note.");
        padded.DeclaredPriorities = ["  Security  ", "Cost"];

        ClosedLoopReasoningRequest trimmed = CreateRequest("Architecture note.");
        trimmed.DeclaredPriorities = ["Security", "Cost"];

        ReviewCacheManifestBuilder.Build(padded).DeclaredPrioritiesHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(trimmed).DeclaredPrioritiesHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_technology_names_differ_only_by_padding_that_changes_sort_order()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-sort-padding";

        TechnologyLedgerEntry leadingSpaceBeta = CreateLedgerEntry(request.RunId, evidenceRef: null);
        leadingSpaceBeta.TechnologyName = " beta";
        leadingSpaceBeta.ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Aws;

        TechnologyLedgerEntry alpha = CreateLedgerEntry(request.RunId, evidenceRef: null);
        alpha.TechnologyName = "Alpha";
        alpha.ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Azure;

        TechnologyLedgerEntry trimmedBeta = CreateLedgerEntry(request.RunId, evidenceRef: null);
        trimmedBeta.TechnologyName = "beta";
        trimmedBeta.ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Aws;

        ReviewCacheManifestBuilder.Build(request, null, [leadingSpaceBeta, alpha]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [alpha, trimmedBeta]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_technology_name_is_null_vs_empty_string()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-null-name";

        TechnologyLedgerEntry nullName = new()
        {
            RunId = request.RunId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = null!,
            ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Azure,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
        };

        TechnologyLedgerEntry emptyName = new()
        {
            RunId = request.RunId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = string.Empty,
            ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Azure,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
        };

        ReviewCacheManifestBuilder.Build(request, null, [nullName]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [emptyName]).ContentHash);
    }

    [Fact]
    public void Build_ignores_null_technology_ledger_entries_when_hashing_content()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-null-slot";

        TechnologyLedgerEntry entry = new()
        {
            RunId = request.RunId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = "Azure",
            ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Azure,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
        };

        ReviewCacheManifestBuilder.Build(request, null, [null!, entry]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [entry]).ContentHash);
    }

    [Fact]
    public void BuildWithResolvedRunId_matches_content_hash_when_resolved_run_id_differs_only_by_surrounding_whitespace()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        ReviewCacheManifestBuilder.BuildWithResolvedRunId(
                request,
                "  aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa  ")
            .ContentHash
            .Should()
            .Be(
                ReviewCacheManifestBuilder.BuildWithResolvedRunId(
                    request,
                    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").ContentHash);
    }

    [Fact]
    public void Build_ignores_null_source_text_entries_when_hashing_content()
    {
        ClosedLoopReasoningRequest withNullEntry = CreateRequest("ignored");
        withNullEntry.SourceTexts =
        [
            null!,
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest single = CreateRequest("Same body.");

        ReviewCacheManifestBuilder.Build(withNullEntry).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(single).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_content_is_null_vs_empty_string()
    {
        ClosedLoopReasoningRequest nullContent = CreateRequest("ignored");
        nullContent.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown",
                Content = null!,
            },
        ];

        ClosedLoopReasoningRequest emptyContent = CreateRequest("ignored");
        emptyContent.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown",
                Content = string.Empty,
            },
        ];

        ReviewCacheManifestBuilder.Build(nullContent).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(emptyContent).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_content_differs_only_by_narrow_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest spaced = CreateRequest("Claims intake for architects.");
        ClosedLoopReasoningRequest narrow = CreateRequest("Claims\u202Fintake for architects.");

        ReviewCacheManifestBuilder.Build(spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(narrow).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_framing_answer_key_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-framing-key-nbsp";

        ArchitectureKnowledgeModel spacedKey = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["business outcome"] = "Secure intake." },
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel nbspKey = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["business\u00A0outcome"] = "Secure intake." },
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, spacedKey).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, nbspKey).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_duplicate_element_ids_differ_only_by_kind_list_order()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-duplicate-element-kind";

        ArchitectureKnowledgeModel serviceFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement { ElementId = "el-1", Name = "API", Kind = ArchitectureElementKind.Component },
                new ArchitectureModelElement { ElementId = "el-1", Name = "API", Kind = ArchitectureElementKind.Interface },
            ],
        };

        ArchitectureKnowledgeModel apiFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement { ElementId = "el-1", Name = "API", Kind = ArchitectureElementKind.Interface },
                new ArchitectureModelElement { ElementId = "el-1", Name = "API", Kind = ArchitectureElementKind.Component },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, serviceFirst).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, apiFirst).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_duplicate_element_ids_differ_only_by_property_bag_list_order()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-duplicate-element-properties";

        ArchitectureKnowledgeModel firstWins = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["env"] = "prod" },
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["env"] = "staging" },
                },
            ],
        };

        ArchitectureKnowledgeModel secondWins = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["env"] = "staging" },
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["env"] = "prod" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, firstWins).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, secondWins).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_duplicate_element_ids_differ_only_by_extraction_confidence_list_order()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-duplicate-element-confidence";

        ArchitectureKnowledgeModel lowFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    ExtractionConfidence = 0.1,
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    ExtractionConfidence = 0.9,
                },
            ],
        };

        ArchitectureKnowledgeModel highFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    ExtractionConfidence = 0.9,
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    ExtractionConfidence = 0.1,
                },
            ],
        };

        ArchitectureKnowledgeModel canonical = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    ExtractionConfidence = 0.1,
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, lowFirst).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, highFirst).ContentHash);

        ReviewCacheManifestBuilder.Build(request, lowFirst).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, canonical).ContentHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_workspace_id_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest spaced = CreateRequest("Architecture note.");
        spaced.WorkspaceId = "workspace cache";

        ClosedLoopReasoningRequest nbsp = CreateRequest("Architecture note.");
        nbsp.WorkspaceId = "workspace\u00A0cache";

        ReviewCacheManifestBuilder.Build(spaced).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nbsp).TenantConfigurationHash);
    }

    [Fact]
    public void BuildWithResolvedRunId_matches_content_hash_when_resolved_run_id_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = string.Empty;

        ReviewCacheManifestBuilder.BuildWithResolvedRunId(request, "run id-001").ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.BuildWithResolvedRunId(request, "run\u00A0id-001").ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_notes_differs_only_by_consecutive_spaces()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-provenance-notes-spaces";

        ArchitectureKnowledgeModel single = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Notes = "Cited from runbook." },
                },
            ],
        };

        ArchitectureKnowledgeModel doubleSpaced = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Notes = "Cited from  runbook." },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, single).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, doubleSpaced).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_framing_answer_value_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-framing-value-nbsp";

        ArchitectureKnowledgeModel spaced = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["business-outcome"] = "Secure intake." },
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel nbsp = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["business-outcome"] = "Secure\u00A0intake." },
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, nbsp).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_client_run_id_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest spaced = CreateRequest("Architecture note.");
        spaced.RunId = "run id-001";

        ClosedLoopReasoningRequest nbsp = CreateRequest("Architecture note.");
        nbsp.RunId = "run\u00A0id-001";

        ReviewCacheManifestBuilder.Build(spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nbsp).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_model_alias_id_differs_only_by_narrow_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest spaced = CreateRequest("Architecture note.");
        spaced.ModelAliasId = "gpt 4.1";

        ClosedLoopReasoningRequest narrow = CreateRequest("Architecture note.");
        narrow.ModelAliasId = "gpt\u202F4.1";

        ReviewCacheManifestBuilder.Build(spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(narrow).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_tenant_id_differs_only_by_narrow_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-tenant-narrow-nbsp";

        ArchitectureKnowledgeModel spaced = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            TenantId = "tenant cache",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel narrow = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            TenantId = "tenant\u202Fcache",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, narrow).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_content_type_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest spaced = CreateRequest("Same body.");
        spaced.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest nbsp = CreateRequest("ignored");
        nbsp.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/mark\u00A0down",
                Content = "Same body.",
            },
        ];

        spaced.SourceTexts[0].ContentType = "text/mark down";

        ReviewCacheManifestBuilder.Build(spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nbsp).ContentHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_tenant_id_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest spaced = CreateRequest("Architecture note.");
        spaced.TenantId = "tenant cache";

        ClosedLoopReasoningRequest nbsp = CreateRequest("Architecture note.");
        nbsp.TenantId = "tenant\u00A0cache";

        ReviewCacheManifestBuilder.Build(spaced).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nbsp).TenantConfigurationHash);

        ReviewCacheManifestBuilder.Build(spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nbsp).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_evidence_ref_differs_only_by_consecutive_spaces()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-evidence-spaces";

        TechnologyLedgerEntry single = CreateLedgerEntry(request.RunId, evidenceRef: "artifact 1");
        TechnologyLedgerEntry doubleSpaced = CreateLedgerEntry(request.RunId, evidenceRef: "artifact  1");

        ReviewCacheManifestBuilder.Build(request, null, [single]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [doubleSpaced]).ContentHash);
    }

    [Fact]
    public void Build_matches_declared_priorities_hash_when_priority_differs_only_by_narrow_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest spaced = CreateRequest("Architecture note.");
        spaced.DeclaredPriorities = ["Cost Optimization"];

        ClosedLoopReasoningRequest narrow = CreateRequest("Architecture note.");
        narrow.DeclaredPriorities = ["Cost\u202FOptimization"];

        ReviewCacheManifestBuilder.Build(spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(narrow).ContentHash);
    }

    [Fact]
    public void Build_matches_declared_priorities_hash_when_priority_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest spaced = CreateRequest("Architecture note.");
        spaced.DeclaredPriorities = ["Cost Optimization"];

        ClosedLoopReasoningRequest nbsp = CreateRequest("Architecture note.");
        nbsp.DeclaredPriorities = ["Cost\u00A0Optimization"];

        ReviewCacheManifestBuilder.Build(spaced).DeclaredPrioritiesHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nbsp).DeclaredPrioritiesHash);

        ReviewCacheManifestBuilder.Build(spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nbsp).ContentHash);
    }

    [Fact]
    public void Build_matches_declared_priorities_hash_when_priority_differs_only_by_consecutive_spaces()
    {
        ClosedLoopReasoningRequest single = CreateRequest("Architecture note.");
        single.DeclaredPriorities = ["Cost Optimization"];

        ClosedLoopReasoningRequest doubleSpaced = CreateRequest("Architecture note.");
        doubleSpaced.DeclaredPriorities = ["Cost  Optimization"];

        ReviewCacheManifestBuilder.Build(single).DeclaredPrioritiesHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(doubleSpaced).DeclaredPrioritiesHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_consecutive_spaces()
    {
        ClosedLoopReasoningRequest single = CreateRequest("Same body.");
        single.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch note.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest doubleSpaced = CreateRequest("ignored");
        doubleSpaced.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch  note.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(single).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(doubleSpaced).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_technology_name_differs_only_by_consecutive_spaces()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-tech-spaces";

        TechnologyLedgerEntry single = CreateLedgerEntry(request.RunId, evidenceRef: null);
        single.TechnologyName = "Azure SQL";

        TechnologyLedgerEntry doubleSpaced = CreateLedgerEntry(request.RunId, evidenceRef: null);
        doubleSpaced.TechnologyName = "Azure  SQL";

        ReviewCacheManifestBuilder.Build(request, null, [single]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [doubleSpaced]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_framing_answer_key_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest spaced = CreateRequest("Architecture note.");
        spaced.FramingAnswers = new Dictionary<string, string> { ["business outcome"] = "Secure intake." };

        ClosedLoopReasoningRequest nbsp = CreateRequest("Architecture note.");
        nbsp.FramingAnswers = new Dictionary<string, string> { ["business\u00A0outcome"] = "Secure intake." };

        ReviewCacheManifestBuilder.Build(spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nbsp).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_framing_answer_value_differs_only_by_consecutive_spaces()
    {
        ClosedLoopReasoningRequest single = CreateRequest("Architecture note.");
        single.FramingAnswers = new Dictionary<string, string> { ["business-outcome"] = "Secure intake." };

        ClosedLoopReasoningRequest doubleSpaced = CreateRequest("Architecture note.");
        doubleSpaced.FramingAnswers = new Dictionary<string, string> { ["business-outcome"] = "Secure  intake." };

        ReviewCacheManifestBuilder.Build(single).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(doubleSpaced).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_model_alias_id_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest spaced = CreateRequest("Architecture note.");
        spaced.ModelAliasId = "gpt 4.1";

        ClosedLoopReasoningRequest nbsp = CreateRequest("Architecture note.");
        nbsp.ModelAliasId = "gpt\u00A04.1";

        ReviewCacheManifestBuilder.Build(spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nbsp).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_property_value_differs_only_by_consecutive_spaces()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-property-value-spaces";

        ArchitectureKnowledgeModel single = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["env"] = "prod tier" },
                },
            ],
        };

        ArchitectureKnowledgeModel doubleSpaced = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["env"] = "prod  tier" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, single).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, doubleSpaced).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_evidence_ref_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-evidence-nbsp";

        TechnologyLedgerEntry spaced = CreateLedgerEntry(request.RunId, evidenceRef: "artifact 1");
        TechnologyLedgerEntry nbsp = CreateLedgerEntry(request.RunId, evidenceRef: "artifact\u00A01");

        ReviewCacheManifestBuilder.Build(request, null, [spaced]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [nbsp]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_technology_name_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-tech-nbsp";

        TechnologyLedgerEntry spaced = CreateLedgerEntry(request.RunId, evidenceRef: null);
        spaced.TechnologyName = "Azure SQL";

        TechnologyLedgerEntry nbsp = CreateLedgerEntry(request.RunId, evidenceRef: null);
        nbsp.TechnologyName = "Azure\u00A0SQL";

        ReviewCacheManifestBuilder.Build(request, null, [spaced]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [nbsp]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_content_differs_only_by_consecutive_spaces()
    {
        ClosedLoopReasoningRequest single = CreateRequest("Claims intake for architects.");
        ClosedLoopReasoningRequest doubleSpaced = CreateRequest("Claims  intake for architects.");

        ReviewCacheManifestBuilder.Build(single).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(doubleSpaced).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_texts_differ_only_by_list_order()
    {
        ClosedLoopReasoningRequest firstOrder = CreateRequest("Primary note.");
        firstOrder.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/a.md",
                ContentType = "text/markdown",
                Content = "Primary note.",
            },
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/b.md",
                ContentType = "text/markdown",
                Content = "Secondary context.",
            },
        ];

        ClosedLoopReasoningRequest secondOrder = CreateRequest("ignored");
        secondOrder.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/b.md",
                ContentType = "text/markdown",
                Content = "Secondary context.",
            },
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/a.md",
                ContentType = "text/markdown",
                Content = "Primary note.",
            },
        ];

        ReviewCacheManifestBuilder.Build(firstOrder).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(secondOrder).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_content_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest spaced = CreateRequest("Claims intake for architects.");
        ClosedLoopReasoningRequest nbsp = CreateRequest("Claims\u00A0intake for architects.");

        ReviewCacheManifestBuilder.Build(spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nbsp).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_content_line_endings_differ()
    {
        ClosedLoopReasoningRequest lf = CreateRequest("Architecture note.\nSecond line.");
        ClosedLoopReasoningRequest crlf = CreateRequest("Architecture note.\r\nSecond line.");

        ReviewCacheManifestBuilder.Build(lf).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(crlf).ContentHash);
    }

    [Theory]
    [InlineData("\u0000")]
    [InlineData("\u001e")]
    [InlineData("\u001d")]
    [InlineData("\u2028")]
    [InlineData("\u2029")]
    [InlineData("\u0085")]
    [InlineData("\u000b")]
    [InlineData("\u000c")]
    [InlineData("\u0084")]
    [InlineData("\u0080")]
    [InlineData("\u0081")]
    [InlineData("\u0082")]
    [InlineData("\u0083")]
    [InlineData("\u0086")]
    [InlineData("\u0087")]
    [InlineData("\u0088")]
    [InlineData("\u0009")]
    [InlineData("\u0001")]
    [InlineData("\u007f")]
    [InlineData("\u200b")]
    public void Build_matches_content_hash_when_source_content_uses_unicode_line_separators(
        string lineSeparator)
    {
        ClosedLoopReasoningRequest lf = CreateRequest("Architecture note.\nSecond line.");
        ClosedLoopReasoningRequest unicodeLine = CreateRequest($"Architecture note.{lineSeparator}Second line.");

        ReviewCacheManifestBuilder.Build(lf).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(unicodeLine).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_content_type_is_whitespace_only_vs_empty_string()
    {
        ClosedLoopReasoningRequest whitespaceType = CreateRequest("Same body.");
        whitespaceType.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "   \t  ",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest emptyType = CreateRequest("Same body.");
        emptyType.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = string.Empty,
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(whitespaceType).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(emptyType).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_content_type_is_null_vs_empty_string()
    {
        ClosedLoopReasoningRequest nullType = CreateRequest("Same body.");
        nullType.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = null!,
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest emptyType = CreateRequest("Same body.");
        emptyType.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = string.Empty,
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(nullType).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(emptyType).ContentHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_non_guid_workspace_differs_only_by_surrounding_whitespace()
    {
        ClosedLoopReasoningRequest padded = CreateRequest("Architecture note.");
        padded.WorkspaceId = "  my-workspace  ";

        ClosedLoopReasoningRequest trimmed = CreateRequest("Architecture note.");
        trimmed.WorkspaceId = "my-workspace";

        ReviewCacheManifestBuilder.Build(padded).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(trimmed).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_declared_priorities_hash_when_list_contains_only_whitespace_entry_vs_empty_list()
    {
        ClosedLoopReasoningRequest whitespaceOnly = CreateRequest("Architecture note.");
        whitespaceOnly.DeclaredPriorities = ["   "];

        ClosedLoopReasoningRequest emptyList = CreateRequest("Architecture note.");
        emptyList.DeclaredPriorities = [];

        ReviewCacheManifestBuilder.Build(whitespaceOnly).DeclaredPrioritiesHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(emptyList).DeclaredPrioritiesHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_project_is_null_vs_empty_string()
    {
        ClosedLoopReasoningRequest nullProject = CreateRequest("Architecture note.");
        nullProject.ProjectId = null;

        ClosedLoopReasoningRequest emptyProject = CreateRequest("Architecture note.");
        emptyProject.ProjectId = string.Empty;

        ReviewCacheManifestBuilder.Build(nullProject).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(emptyProject).TenantConfigurationHash);
    }

    [Fact]
    public void BuildContinueFromExistingRunCoalesceManifest_matches_hash_when_tenant_differs_only_by_surrounding_whitespace()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.ContinueFromExistingRun = true;

        ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "  tenant-cache  ",
                "run-continue")
            .ContentHash
            .Should()
            .Be(
                ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                    request,
                    "tenant-cache",
                    "run-continue").ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_framing_answer_is_whitespace_only_vs_omitted()
    {
        ClosedLoopReasoningRequest whitespaceAnswer = CreateRequest("Architecture note.");
        whitespaceAnswer.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["scope"] = "   \u00a0  ",
        };

        ClosedLoopReasoningRequest omitted = CreateRequest("Architecture note.");

        ReviewCacheManifestBuilder.Build(whitespaceAnswer).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(omitted).ContentHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_workspace_is_null_vs_empty_string()
    {
        ClosedLoopReasoningRequest nullWorkspace = CreateRequest("Architecture note.");
        nullWorkspace.WorkspaceId = null;

        ClosedLoopReasoningRequest emptyWorkspace = CreateRequest("Architecture note.");
        emptyWorkspace.WorkspaceId = string.Empty;

        ReviewCacheManifestBuilder.Build(nullWorkspace).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(emptyWorkspace).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_content_type_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest lower = CreateRequest("Same body.");
        lower.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest upper = CreateRequest("ignored");
        upper.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "TEXT/MARKDOWN",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_unicode_normalization_form()
    {
        const string nfcFileName = "docs/Caf\u00E9.md";
        const string nfdFileName = "docs/Cafe\u0301.md";

        ClosedLoopReasoningRequest nfc = CreateRequest("Same body.");
        nfc.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = nfcFileName,
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest nfd = CreateRequest("ignored");
        nfd.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = nfdFileName,
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(nfc).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nfd).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_path_separator()
    {
        ClosedLoopReasoningRequest forwardSlash = CreateRequest("Same body.");
        forwardSlash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest backslash = CreateRequest("ignored");
        backslash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\\arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_leading_dot_slash_or_duplicate_slashes()
    {
        ClosedLoopReasoningRequest canonical = CreateRequest("Same body.");
        canonical.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest leadingDotSlash = CreateRequest("ignored");
        leadingDotSlash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "./docs/arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest duplicateSlash = CreateRequest("ignored");
        duplicateSlash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs//arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        string canonicalHash = ReviewCacheManifestBuilder.Build(canonical).ContentHash;

        ReviewCacheManifestBuilder.Build(leadingDotSlash).ContentHash.Should().Be(canonicalHash);
        ReviewCacheManifestBuilder.Build(duplicateSlash).ContentHash.Should().Be(canonicalHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_dot_segments_or_slashes()
    {
        ClosedLoopReasoningRequest canonical = CreateRequest("Same body.");
        canonical.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest dotSegment = CreateRequest("ignored");
        dotSegment.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/./arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest trailingSlash = CreateRequest("ignored");
        trailingSlash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch.md/",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest leadingSlash = CreateRequest("ignored");
        leadingSlash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "/docs/arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        string canonicalHash = ReviewCacheManifestBuilder.Build(canonical).ContentHash;

        ReviewCacheManifestBuilder.Build(dotSegment).ContentHash.Should().Be(canonicalHash);
        ReviewCacheManifestBuilder.Build(trailingSlash).ContentHash.Should().Be(canonicalHash);
        ReviewCacheManifestBuilder.Build(leadingSlash).ContentHash.Should().Be(canonicalHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_parent_path_segments()
    {
        ClosedLoopReasoningRequest canonical = CreateRequest("Same body.");
        canonical.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest childSegment = CreateRequest("ignored");
        childSegment.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/sub/../arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest nestedParent = CreateRequest("ignored");
        nestedParent.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/foo/bar/../../arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        string canonicalHash = ReviewCacheManifestBuilder.Build(canonical).ContentHash;

        ReviewCacheManifestBuilder.Build(childSegment).ContentHash.Should().Be(canonicalHash);
        ReviewCacheManifestBuilder.Build(nestedParent).ContentHash.Should().Be(canonicalHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_slash()
    {
        ClosedLoopReasoningRequest literalSlash = CreateRequest("Same body.");
        literalSlash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encodedSlash = CreateRequest("ignored");
        encodedSlash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%2Farch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(literalSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encodedSlash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_space()
    {
        ClosedLoopReasoningRequest literalSpace = CreateRequest("Same body.");
        literalSpace.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch note.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encodedSpace = CreateRequest("ignored");
        encodedSpace.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch%20note.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(literalSpace).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encodedSpace).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_content_differs_only_by_utf8_bom_prefix()
    {
        ClosedLoopReasoningRequest withoutBom = CreateRequest("Same body.");
        withoutBom.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest withBom = CreateRequest("ignored");
        withBom.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown",
                Content = "\uFEFFSame body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(withoutBom).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(withBom).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_content_type_differs_only_by_charset_parameter()
    {
        ClosedLoopReasoningRequest bare = CreateRequest("Same body.");
        bare.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest withCharset = CreateRequest("ignored");
        withCharset.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown; charset=utf-8",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(bare).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(withCharset).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_framing_answer_differs_only_by_unicode_normalization_form()
    {
        const string nfcAnswer = "Caf\u00E9 intake";
        const string nfdAnswer = "Cafe\u0301 intake";

        ClosedLoopReasoningRequest nfcRequest = CreateRequest("Architecture note.");
        nfcRequest.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["outcome"] = nfcAnswer,
        };

        ClosedLoopReasoningRequest nfdRequest = CreateRequest("Architecture note.");
        nfdRequest.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["outcome"] = nfdAnswer,
        };

        ReviewCacheManifestBuilder.Build(nfcRequest).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nfdRequest).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_framing_key_differs_only_by_unicode_normalization_form()
    {
        const string nfcKey = "caf\u00E9-scope";
        const string nfdKey = "cafe\u0301-scope";

        ClosedLoopReasoningRequest nfcRequest = CreateRequest("Architecture note.");
        nfcRequest.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            [nfcKey] = "Secure intake",
        };

        ClosedLoopReasoningRequest nfdRequest = CreateRequest("Architecture note.");
        nfdRequest.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            [nfdKey] = "Secure intake",
        };

        ReviewCacheManifestBuilder.Build(nfcRequest).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nfdRequest).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_framing_keys_differ_only_by_casing()
    {
        ClosedLoopReasoningRequest lowerKey = CreateRequest("Architecture note.");
        lowerKey.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["business-outcome"] = "Secure intake",
        };

        ClosedLoopReasoningRequest upperKey = CreateRequest("Architecture note.");
        upperKey.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["Business-Outcome"] = "Secure intake",
        };

        ReviewCacheManifestBuilder.Build(lowerKey).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(upperKey).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_duplicate_framing_keys_include_whitespace_only_casing_variant()
    {
        ClosedLoopReasoningRequest duplicateKeys = CreateRequest("Architecture note.");
        duplicateKeys.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["Scope"] = "   ",
            ["scope"] = "security",
        };

        ClosedLoopReasoningRequest canonical = CreateRequest("Architecture note.");
        canonical.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["scope"] = "security",
        };

        ReviewCacheManifestBuilder.Build(duplicateKeys).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(canonical).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_framing_answer_is_empty_vs_omitted()
    {
        ClosedLoopReasoningRequest emptyAnswer = CreateRequest("Architecture note.");
        emptyAnswer.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["scope"] = string.Empty,
        };

        ClosedLoopReasoningRequest omitted = CreateRequest("Architecture note.");

        ReviewCacheManifestBuilder.Build(emptyAnswer).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(omitted).ContentHash);
    }

    [Fact]
    public void Build_normalizes_framing_answer_keys_and_values()
    {
        ClosedLoopReasoningRequest spaced = CreateRequest("Architecture note.");
        spaced.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            [" scope "] = "  security  ",
        };

        ClosedLoopReasoningRequest normalized = CreateRequest("Architecture note.");
        normalized.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["scope"] = "security",
        };

        ReviewCacheManifestBuilder.Build(spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(normalized).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_run_id_differs_only_by_hex_letter_casing()
    {
        ClosedLoopReasoningRequest lower = CreateRequest("Architecture note.");
        lower.RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        ClosedLoopReasoningRequest upper = CreateRequest("Architecture note.");
        upper.RunId = "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA";

        ReviewCacheManifestBuilder.Build(lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(upper).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_client_supplied_run_id_differs_with_same_sources()
    {
        ClosedLoopReasoningRequest runA = CreateRequest("Architecture note.");
        runA.RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        ClosedLoopReasoningRequest runB = CreateRequest("Architecture note.");
        runB.RunId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

        ReviewCacheManifestBuilder.Build(runA).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(runB).ContentHash);
    }

    [Fact]
    public void BuildWithResolvedRunId_emits_model_fingerprint_for_assigned_run_id()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");

        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-assigned",
            RunId = "assigned-run-id",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.BuildWithResolvedRunId(
                request,
                "assigned-run-id",
                model).ContentHash);
    }

    [Fact]
    public void BuildContinueFromExistingRunCoalesceManifest_matches_hash_when_tenant_differs_only_by_guid_hex_letter_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.ContinueFromExistingRun = true;

        ReviewCacheDependencyManifest lowerTenant =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "run-continue");

        ReviewCacheDependencyManifest upperTenant =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA",
                "run-continue");

        lowerTenant.ContentHash.Should().Be(upperTenant.ContentHash);
    }

    [Fact]
    public void BuildContinueFromExistingRunCoalesceManifest_partitions_from_continue_build()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.ContinueFromExistingRun = true;

        ReviewCacheDependencyManifest continueBuild = ReviewCacheManifestBuilder.Build(request);
        ReviewCacheDependencyManifest coalesceManifest =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-cache",
                "run-continue");

        coalesceManifest.ContentHash.Should().NotBe(continueBuild.ContentHash);
        coalesceManifest.ReuseReason.Should().Be("closed-loop-continue-existing");
    }

    [Fact]
    public void BuildContinueFromExistingRunCoalesceManifest_changes_hash_when_baseline_model_changes_and_request_run_id_blank()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.ContinueFromExistingRun = true;
        request.RunId = null;

        ArchitectureKnowledgeModel baseline = new()
        {
            ModelId = "model-1",
            RunId = "run-continue",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel changed = new()
        {
            ModelId = "model-1",
            RunId = "run-continue",
            Elements =
            [
                new ArchitectureModelElement { ElementId = "el-1", Name = "API" },
                new ArchitectureModelElement { ElementId = "el-2", Name = "Worker" },
            ],
        };

        ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-cache",
                "run-continue",
                baseline)
            .ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-cache",
                "run-continue",
                changed)
                .ContentHash);
    }

    [Fact]
    public void BuildWithResolvedRunId_matches_build_content_hash_when_request_carries_same_run_id()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        ArchitectureKnowledgeModel baseline = new()
        {
            ModelId = "model-1",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheDependencyManifest lookupManifest =
            ReviewCacheManifestBuilder.Build(request, baseline, technologyLedgerEntries: null);

        ReviewCacheDependencyManifest storageManifest =
            ReviewCacheManifestBuilder.BuildWithResolvedRunId(
                request,
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                baseline,
                technologyLedgerEntries: null);

        lookupManifest.ContentHash.Should().Be(storageManifest.ContentHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_workspace_differs_only_by_hex_letter_casing()
    {
        ClosedLoopReasoningRequest lower = CreateRequest("Architecture note.");
        lower.WorkspaceId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        ClosedLoopReasoningRequest upper = CreateRequest("Architecture note.");
        upper.WorkspaceId = "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA";

        ReviewCacheManifestBuilder.Build(lower).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(upper).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_evidence_ref_is_null_vs_empty_string()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-evidence-null";

        TechnologyLedgerEntry nullRef = CreateLedgerEntry(request.RunId, evidenceRef: null);
        TechnologyLedgerEntry emptyRef = CreateLedgerEntry(request.RunId, evidenceRef: string.Empty);

        ReviewCacheManifestBuilder.Build(request, null, [nullRef]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [emptyRef]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_evidence_ref_is_whitespace_only_vs_empty_string()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-evidence-ws";

        TechnologyLedgerEntry whitespaceRef = CreateLedgerEntry(request.RunId, evidenceRef: "   \t  ");
        TechnologyLedgerEntry emptyRef = CreateLedgerEntry(request.RunId, evidenceRef: string.Empty);

        ReviewCacheManifestBuilder.Build(request, null, [whitespaceRef]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [emptyRef]).ContentHash);
    }

    [Fact]
    public void Build_changes_tenant_configuration_hash_when_workspace_changes()
    {
        ClosedLoopReasoningRequest workspaceA = CreateRequest("Architecture note.");
        workspaceA.WorkspaceId = "11111111-1111-1111-1111-111111111111";

        ClosedLoopReasoningRequest workspaceB = CreateRequest("Architecture note.");
        workspaceB.WorkspaceId = "22222222-2222-2222-2222-222222222222";

        ReviewCacheManifestBuilder.Build(workspaceA).TenantConfigurationHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(workspaceB).TenantConfigurationHash);
    }

    private static TechnologyLedgerEntry CreateLedgerEntry(string runId, string? evidenceRef)
    {
        return new TechnologyLedgerEntry
        {
            RunId = runId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = "Microsoft Azure",
            ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Azure,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
            EvidenceRef = evidenceRef,
        };
    }

    private static ClosedLoopReasoningRequest CreateRequest(string content)
    {
        return new ClosedLoopReasoningRequest
        {
            TenantId = "tenant-cache",
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "arch.md",
                    ContentType = "text/markdown",
                    Content = content,
                },
            ],
        };
    }
}
