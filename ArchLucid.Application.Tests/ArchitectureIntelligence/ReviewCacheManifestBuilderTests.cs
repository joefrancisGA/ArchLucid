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
    public void Build_matches_content_hash_when_baseline_related_element_ids_differ_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-related-id-casing";

        ArchitectureKnowledgeModel lower = new()
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

        ArchitectureKnowledgeModel upper = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    RelatedElementIds = ["EL-2"],
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_related_element_ids_include_duplicates_differing_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-related-id-casing-dedupe";

        ArchitectureKnowledgeModel mixed = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    RelatedElementIds = ["el-2", "EL-2"],
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
                    RelatedElementIds = ["el-2"],
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, mixed).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, canonical).ContentHash);
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
    public void Build_matches_content_hash_when_baseline_source_passage_ids_differ_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-id-casing";

        ArchitectureKnowledgeModel lower = new()
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

        ArchitectureKnowledgeModel upper = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    SourcePassageIds = ["PASSAGE-1"],
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
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
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_locator_artifact_id_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-artifact-casing";

        ArchitectureKnowledgeModel lower = new()
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

        ArchitectureKnowledgeModel upper = new()
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
                        PassageLocator = new SourcePassageLocator { ArtifactId = "ARTIFACT-1" },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
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
    public void Build_matches_content_hash_when_baseline_element_provenance_source_artifact_id_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-provenance-artifact-casing";

        ArchitectureKnowledgeModel lower = new()
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

        ArchitectureKnowledgeModel upper = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SourceArtifactId = "ARTIFACT-1" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
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
    public void Build_partitions_content_hash_when_client_run_id_omitted_vs_supplied_with_same_sources()
    {
        ClosedLoopReasoningRequest omitted = CreateRequest("Architecture note.");

        ClosedLoopReasoningRequest supplied = CreateRequest("Architecture note.");
        supplied.RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        ArchitectureKnowledgeModel baseline = new()
        {
            ModelId = "model-1",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(omitted).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(supplied, baseline, technologyLedgerEntries: null).ContentHash);
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
    public void BuildWithResolvedRunId_matches_content_hash_when_resolved_run_id_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "tenants/acme/runs/42";

        ReviewCacheManifestBuilder.BuildWithResolvedRunId(request, "tenants/acme/runs/42").ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.BuildWithResolvedRunId(request, "tenants\\acme\\runs\\42").ContentHash);
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
    public void Build_matches_content_hash_when_ledger_technology_name_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-tech-casing";

        TechnologyLedgerEntry lower = CreateLedgerEntry(request.RunId, evidenceRef: null);
        lower.TechnologyName = "Microsoft Azure";

        TechnologyLedgerEntry upper = CreateLedgerEntry(request.RunId, evidenceRef: null);
        upper.TechnologyName = "microsoft azure";

        ReviewCacheManifestBuilder.Build(request, null, [lower]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [upper]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_evidence_ref_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-evidence-casing";

        TechnologyLedgerEntry lower = CreateLedgerEntry(request.RunId, evidenceRef: "evidence:alpha");
        TechnologyLedgerEntry upper = CreateLedgerEntry(request.RunId, evidenceRef: "EVIDENCE:ALPHA");

        ReviewCacheManifestBuilder.Build(request, null, [lower]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [upper]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_tenant_id_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-tenant-casing";

        ArchitectureKnowledgeModel lower = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            TenantId = "tenant-cache",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel upper = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            TenantId = "TENANT-CACHE",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_model_alias_id_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest lower = CreateRequest("Architecture note.");
        lower.ModelAliasId = "gpt-4.1";

        ClosedLoopReasoningRequest upper = CreateRequest("Architecture note.");
        upper.ModelAliasId = "GPT-4.1";

        ReviewCacheManifestBuilder.Build(lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_framing_answer_key_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-framing-key-casing";

        ArchitectureKnowledgeModel lower = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["business-outcome"] = "Secure intake." },
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel upper = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["Business-Outcome"] = "Secure intake." },
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_framing_answer_value_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-framing-value-casing";

        ArchitectureKnowledgeModel lower = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["business-outcome"] = "secure intake." },
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel upper = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["business-outcome"] = "Secure Intake." },
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_name_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-name-casing";

        ArchitectureKnowledgeModel lower = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "api gateway" }],
        };

        ArchitectureKnowledgeModel upper = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API Gateway" }],
        };

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_description_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-description-casing";

        ArchitectureKnowledgeModel lower = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement { ElementId = "el-1", Name = "API", Description = "public http api" },
            ],
        };

        ArchitectureKnowledgeModel upper = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement { ElementId = "el-1", Name = "API", Description = "Public HTTP API" },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_property_value_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-property-value-casing";

        ArchitectureKnowledgeModel lower = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["env"] = "production" },
                },
            ],
        };

        ArchitectureKnowledgeModel upper = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["env"] = "Production" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_property_key_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-property-key-casing";

        ArchitectureKnowledgeModel lower = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["environment"] = "prod" },
                },
            ],
        };

        ArchitectureKnowledgeModel upper = new()
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

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_notes_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-provenance-notes-casing";

        ArchitectureKnowledgeModel lower = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Notes = "cited from runbook" },
                },
            ],
        };

        ArchitectureKnowledgeModel upper = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Notes = "Cited From Runbook" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_quote_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-quote-casing";

        ArchitectureKnowledgeModel lower = new()
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
                        PassageLocator = new SourcePassageLocator { Quote = "claims intake" },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel upper = new()
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
                        PassageLocator = new SourcePassageLocator { Quote = "Claims Intake" },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
    }

    [Fact]
    public void Build_matches_declared_priorities_hash_when_priorities_differ_only_by_casing()
    {
        ClosedLoopReasoningRequest lower = CreateRequest("Architecture note.");
        lower.DeclaredPriorities = ["security", "cost"];

        ClosedLoopReasoningRequest upper = CreateRequest("Architecture note.");
        upper.DeclaredPriorities = ["Security", "Cost"];

        ReviewCacheManifestBuilder.Build(lower).DeclaredPrioritiesHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(upper).DeclaredPrioritiesHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_tenant_slug_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest lower = CreateRequest("Architecture note.");
        lower.TenantId = "tenant-slug";

        ClosedLoopReasoningRequest upper = CreateRequest("Architecture note.");
        upper.TenantId = "Tenant-Slug";

        ReviewCacheManifestBuilder.Build(lower).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(upper).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_file_name_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest lower = CreateRequest("Architecture note.");
        lower.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch.md",
                ContentType = "text/markdown",
                Content = "Architecture note.",
            },
        ];

        ClosedLoopReasoningRequest upper = CreateRequest("Architecture note.");
        upper.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/ARCH.md",
                ContentType = "text/markdown",
                Content = "Architecture note.",
            },
        ];

        ReviewCacheManifestBuilder.Build(lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(upper).ContentHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_workspace_slug_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest lower = CreateRequest("Architecture note.");
        lower.WorkspaceId = "workspace-slug";

        ClosedLoopReasoningRequest upper = CreateRequest("Architecture note.");
        upper.WorkspaceId = "Workspace-Slug";

        ReviewCacheManifestBuilder.Build(lower).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(upper).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_project_slug_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest lower = CreateRequest("Architecture note.");
        lower.ProjectId = "project-slug";

        ClosedLoopReasoningRequest upper = CreateRequest("Architecture note.");
        upper.ProjectId = "Project-Slug";

        ReviewCacheManifestBuilder.Build(lower).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(upper).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_request_framing_answer_value_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest lower = CreateRequest("Architecture note.");
        lower.FramingAnswers = new Dictionary<string, string> { ["business-outcome"] = "secure intake." };

        ClosedLoopReasoningRequest upper = CreateRequest("Architecture note.");
        upper.FramingAnswers = new Dictionary<string, string> { ["business-outcome"] = "Secure Intake." };

        ReviewCacheManifestBuilder.Build(lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_offsets_are_null_vs_zero()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-offset-null-zero";

        ArchitectureKnowledgeModel nullOffsets = new()
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

        ArchitectureKnowledgeModel zeroOffsets = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            StartOffset = 0,
                            EndOffset = 0,
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, nullOffsets).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, zeroOffsets).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_start_is_null_vs_zero_with_end_offset()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-start-null-zero";

        ArchitectureKnowledgeModel nullStart = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            EndOffset = 42,
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel zeroStart = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            StartOffset = 0,
                            EndOffset = 42,
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, nullStart).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, zeroStart).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_end_is_null_vs_zero_with_start_offset()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-end-null-zero";

        ArchitectureKnowledgeModel nullEnd = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            StartOffset = 10,
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel zeroEnd = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            StartOffset = 10,
                            EndOffset = 0,
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, nullEnd).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, zeroEnd).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_start_is_zero_vs_null_with_unset_end()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-start-zero-null-open";

        ArchitectureKnowledgeModel zeroStart = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            StartOffset = 0,
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel nullStart = new()
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

        ReviewCacheManifestBuilder.Build(request, zeroStart).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, nullStart).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_description_is_null_vs_empty_string()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-description-null-empty";

        ArchitectureKnowledgeModel nullDescription = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API", Description = null }],
        };

        ArchitectureKnowledgeModel emptyDescription = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API", Description = string.Empty }],
        };

        ReviewCacheManifestBuilder.Build(request, nullDescription).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, emptyDescription).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_duplicate_element_ids_differ_only_by_provenance_confidence_list_order()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-duplicate-provenance-confidence";

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
                    Provenance = new ClaimProvenance { Confidence = 0.2 },
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Confidence = 0.8 },
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
                    Provenance = new ClaimProvenance { Confidence = 0.8 },
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Confidence = 0.2 },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, lowFirst).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, highFirst).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_request_framing_answers_are_empty_vs_omitted()
    {
        ClosedLoopReasoningRequest withEmpty = CreateRequest("Architecture note.");
        withEmpty.FramingAnswers = new Dictionary<string, string>();

        ClosedLoopReasoningRequest omitted = CreateRequest("Architecture note.");

        ReviewCacheManifestBuilder.Build(withEmpty).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(omitted).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_locator_is_null_vs_empty_object()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-locator-null-empty";

        ArchitectureKnowledgeModel nullLocator = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { PassageLocator = null },
                },
            ],
        };

        ArchitectureKnowledgeModel emptyLocator = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { PassageLocator = new SourcePassageLocator() },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, nullLocator).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, emptyLocator).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_artifact_id_is_null_vs_empty_string()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-artifact-null-empty";

        ArchitectureKnowledgeModel defaultArtifact = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { PassageLocator = new SourcePassageLocator() },
                },
            ],
        };

        ArchitectureKnowledgeModel emptyArtifact = new()
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
                        PassageLocator = new SourcePassageLocator { ArtifactId = string.Empty },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, defaultArtifact).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, emptyArtifact).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_duplicate_element_ids_differ_only_by_provenance_origin_list_order()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-duplicate-provenance-origin";

        ArchitectureKnowledgeModel inferredFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Origin = ClaimOrigin.ModelInferred },
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Origin = ClaimOrigin.DirectlyExtracted },
                },
            ],
        };

        ArchitectureKnowledgeModel extractedFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Origin = ClaimOrigin.DirectlyExtracted },
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Origin = ClaimOrigin.ModelInferred },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, inferredFirst).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, extractedFirst).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_source_artifact_id_is_default_vs_empty_string()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-source-artifact-default-empty";

        ArchitectureKnowledgeModel defaultArtifact = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance(),
                },
            ],
        };

        ArchitectureKnowledgeModel emptyArtifact = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SourceArtifactId = string.Empty },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, defaultArtifact).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, emptyArtifact).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_quote_is_null_vs_empty_string()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-quote-null-empty";

        ArchitectureKnowledgeModel nullQuote = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            Quote = null,
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel emptyQuote = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            Quote = string.Empty,
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, nullQuote).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, emptyQuote).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_section_path_is_null_vs_empty_string()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-section-null-empty";

        ArchitectureKnowledgeModel nullSection = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = null,
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel emptySection = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = string.Empty,
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, nullSection).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, emptySection).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_baseline_element_provenance_passage_section_path_differs()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-section-diff";

        ArchitectureKnowledgeModel sectionA = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "intro",
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel sectionB = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "architecture",
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, sectionA).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(request, sectionB).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_baseline_element_provenance_passage_locator_is_null_vs_section_path_only()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-section-only";

        ArchitectureKnowledgeModel noLocator = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { PassageLocator = null },
                },
            ],
        };

        ArchitectureKnowledgeModel sectionOnly = new()
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
                        PassageLocator = new SourcePassageLocator { SectionPath = "architecture/overview" },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, noLocator).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(request, sectionOnly).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_section_path_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-section-casing";

        ArchitectureKnowledgeModel lower = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "architecture/overview",
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel upper = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "Architecture/Overview",
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_section_path_differs_only_by_nbsp_vs_space()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-section-nbsp";

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
                    Provenance = new ClaimProvenance
                    {
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "architecture overview",
                        },
                    },
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
                    Provenance = new ClaimProvenance
                    {
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "architecture\u00A0overview",
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, nbsp).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_section_path_is_whitespace_only_vs_empty_with_artifact()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-section-ws-empty";

        ArchitectureKnowledgeModel whitespaceSection = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "   \t  ",
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel emptySection = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = string.Empty,
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, whitespaceSection).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, emptySection).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_baseline_element_provenance_passage_locator_has_offsets_only_vs_null_locator()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-offsets-only";

        ArchitectureKnowledgeModel nullLocator = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { PassageLocator = null },
                },
            ],
        };

        ArchitectureKnowledgeModel offsetsOnly = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            StartOffset = 12,
                            EndOffset = 48,
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, nullLocator).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(request, offsetsOnly).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_locator_has_zero_offsets_only_vs_null_locator()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-zero-offsets-only";

        ArchitectureKnowledgeModel nullLocator = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { PassageLocator = null },
                },
            ],
        };

        ArchitectureKnowledgeModel zeroOffsetsOnly = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            StartOffset = 0,
                            EndOffset = 0,
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, nullLocator).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, zeroOffsetsOnly).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_baseline_element_provenance_passage_quote_only_vs_null_locator()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-quote-only";

        ArchitectureKnowledgeModel nullLocator = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { PassageLocator = null },
                },
            ],
        };

        ArchitectureKnowledgeModel quoteOnly = new()
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
                        PassageLocator = new SourcePassageLocator { Quote = "public API gateway" },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, nullLocator).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(request, quoteOnly).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_quote_is_whitespace_only_vs_null_locator()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-quote-ws-null";

        ArchitectureKnowledgeModel nullLocator = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { PassageLocator = null },
                },
            ],
        };

        ArchitectureKnowledgeModel whitespaceQuote = new()
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
                        PassageLocator = new SourcePassageLocator { Quote = "   \t  " },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, nullLocator).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, whitespaceQuote).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_artifact_id_is_whitespace_only_vs_null_locator()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-artifact-ws-null";

        ArchitectureKnowledgeModel nullLocator = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { PassageLocator = null },
                },
            ],
        };

        ArchitectureKnowledgeModel whitespaceArtifact = new()
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
                        PassageLocator = new SourcePassageLocator { ArtifactId = "   \t  " },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, nullLocator).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, whitespaceArtifact).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_locator_has_open_start_zero_only_vs_null_locator()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-open-zero-null";

        ArchitectureKnowledgeModel nullLocator = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { PassageLocator = null },
                },
            ],
        };

        ArchitectureKnowledgeModel openZeroStart = new()
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
                        PassageLocator = new SourcePassageLocator { StartOffset = 0 },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, nullLocator).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, openZeroStart).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_related_element_ids_contain_whitespace_only_entry_vs_empty_list()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-related-ws-empty";

        ArchitectureKnowledgeModel whitespaceRelated = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    RelatedElementIds = ["   \t  "],
                },
            ],
        };

        ArchitectureKnowledgeModel emptyRelated = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API", RelatedElementIds = [] }],
        };

        ReviewCacheManifestBuilder.Build(request, whitespaceRelated).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, emptyRelated).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_property_value_is_null_vs_empty_string()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-property-value-null-empty";

        ArchitectureKnowledgeModel nullValue = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["tier"] = null! },
                },
            ],
        };

        ArchitectureKnowledgeModel emptyValue = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["tier"] = string.Empty },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, nullValue).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, emptyValue).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_artifact_with_zero_offsets_matches_artifact_only()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-artifact-zero-offsets";

        ArchitectureKnowledgeModel artifactOnly = new()
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

        ArchitectureKnowledgeModel artifactWithZeroOffsets = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            StartOffset = 0,
                            EndOffset = 0,
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, artifactOnly).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, artifactWithZeroOffsets).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_declared_priorities_are_empty_vs_omitted()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-declared-priorities-empty-omitted";

        ArchitectureKnowledgeModel emptyPriorities = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            DeclaredPriorities = [],
        };

        ArchitectureKnowledgeModel omittedPriorities = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
        };

        ReviewCacheManifestBuilder.Build(request, emptyPriorities).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, omittedPriorities).ContentHash);
    }

    [Fact]
    public void Build_matches_declared_priorities_hash_when_request_priorities_are_whitespace_only_vs_empty_list()
    {
        ClosedLoopReasoningRequest whitespaceOnly = CreateRequest("Architecture note.");
        whitespaceOnly.DeclaredPriorities = ["   \t  ", "  "];

        ClosedLoopReasoningRequest emptyList = CreateRequest("Architecture note.");
        emptyList.DeclaredPriorities = [];

        ReviewCacheManifestBuilder.Build(whitespaceOnly).DeclaredPrioritiesHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(emptyList).DeclaredPrioritiesHash);
    }

    [Fact]
    public void BuildContinueFromExistingRunCoalesceManifest_matches_declared_priorities_hash_when_priorities_are_whitespace_only_vs_empty_list()
    {
        ClosedLoopReasoningRequest whitespaceOnly = CreateRequest("Architecture note.");
        whitespaceOnly.ContinueFromExistingRun = true;
        whitespaceOnly.DeclaredPriorities = ["   \t  ", "  "];

        ClosedLoopReasoningRequest emptyList = CreateRequest("Architecture note.");
        emptyList.ContinueFromExistingRun = true;
        emptyList.DeclaredPriorities = [];

        ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                whitespaceOnly,
                "tenant-continue-priorities",
                "run-continue-priorities")
            .DeclaredPrioritiesHash
            .Should()
            .Be(
                ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                        emptyList,
                        "tenant-continue-priorities",
                        "run-continue-priorities")
                    .DeclaredPrioritiesHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_source_passage_ids_contain_whitespace_only_entry_vs_empty_list()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-ids-ws-empty";

        ArchitectureKnowledgeModel whitespacePassage = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    SourcePassageIds = ["   \t  "],
                },
            ],
        };

        ArchitectureKnowledgeModel emptyPassages = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API", SourcePassageIds = [] }],
        };

        ReviewCacheManifestBuilder.Build(request, whitespacePassage).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, emptyPassages).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_section_path_differs_only_by_unicode_normalization_form()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-section-unicode";

        const string composed = "caf\u00e9/overview";
        string decomposed = "caf\u0065\u0301/overview";

        ArchitectureKnowledgeModel composedModel = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = composed,
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel decomposedModel = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = decomposed,
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, composedModel).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, decomposedModel).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_properties_contain_whitespace_only_key_vs_empty_bag()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-property-key-ws-empty";

        ArchitectureKnowledgeModel whitespaceKey = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["   \t  "] = "value" },
                },
            ],
        };

        ArchitectureKnowledgeModel emptyBag = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API", Properties = new Dictionary<string, string>() }],
        };

        ReviewCacheManifestBuilder.Build(request, whitespaceKey).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, emptyBag).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_framing_answer_key_is_whitespace_only_vs_omitted()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-framing-key-ws-omitted";

        ArchitectureKnowledgeModel whitespaceKey = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["   \t  "] = "answer" },
        };

        ArchitectureKnowledgeModel omittedKey = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
        };

        ReviewCacheManifestBuilder.Build(request, whitespaceKey).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, omittedKey).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_duplicate_element_ids_differ_only_by_provenance_source_artifact_id_list_order()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-duplicate-provenance-source-artifact";

        ArchitectureKnowledgeModel artifactAFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SourceArtifactId = "artifact-a" },
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SourceArtifactId = "artifact-b" },
                },
            ],
        };

        ArchitectureKnowledgeModel artifactBFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SourceArtifactId = "artifact-b" },
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SourceArtifactId = "artifact-a" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, artifactAFirst).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, artifactBFirst).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_baseline_element_provenance_passage_end_is_set_vs_open_at_same_start()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-closed-vs-open";

        ArchitectureKnowledgeModel closedRange = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            StartOffset = 10,
                            EndOffset = 10,
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel openRange = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            StartOffset = 10,
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, closedRange).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(request, openRange).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_model_alias_id_is_whitespace_only_vs_empty_string()
    {
        ClosedLoopReasoningRequest whitespaceAlias = CreateRequest("Architecture note.");
        whitespaceAlias.ModelAliasId = "   \t  ";

        ClosedLoopReasoningRequest emptyAlias = CreateRequest("Architecture note.");
        emptyAlias.ModelAliasId = string.Empty;

        ReviewCacheManifestBuilder.Build(whitespaceAlias).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(emptyAlias).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_elements_are_duplicate_identical_rows_in_different_list_order()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-duplicate-identical-rows";

        ArchitectureModelElement row = new()
        {
            ElementId = "el-1",
            Name = "API",
            Provenance = new ClaimProvenance { Origin = ClaimOrigin.DirectlyExtracted },
        };

        ArchitectureKnowledgeModel firstSecond = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [row, new ArchitectureModelElement { ElementId = "el-1", Name = "API", Provenance = new ClaimProvenance { Origin = ClaimOrigin.DirectlyExtracted } }],
        };

        ArchitectureKnowledgeModel secondFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API", Provenance = new ClaimProvenance { Origin = ClaimOrigin.DirectlyExtracted } }, row],
        };

        ReviewCacheManifestBuilder.Build(request, firstSecond).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, secondFirst).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_framing_answer_keys_differ_only_by_casing_with_different_values_in_list_order()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-framing-dup-keys";

        ArchitectureKnowledgeModel costFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string>
            {
                ["Cost"] = "optimize",
                ["cost"] = "security",
            },
        };

        ArchitectureKnowledgeModel lowerFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string>
            {
                ["cost"] = "security",
                ["Cost"] = "optimize",
            },
        };

        ReviewCacheManifestBuilder.Build(request, costFirst).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, lowerFirst).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_related_element_ids_include_duplicate_entries_vs_distinct()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-related-dup-distinct";

        ArchitectureKnowledgeModel withDuplicates = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    RelatedElementIds = ["el-2", "el-2", "el-2"],
                },
            ],
        };

        ArchitectureKnowledgeModel distinct = new()
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

        ReviewCacheManifestBuilder.Build(request, withDuplicates).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, distinct).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_source_passage_ids_include_duplicate_entries_vs_distinct()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-ids-dup-distinct";

        ArchitectureKnowledgeModel withDuplicates = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    SourcePassageIds = ["passage-1", "passage-1"],
                },
            ],
        };

        ArchitectureKnowledgeModel distinct = new()
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

        ReviewCacheManifestBuilder.Build(request, withDuplicates).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, distinct).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_extraction_confidence_formats_equivalent_decimals()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-confidence-format";

        ArchitectureKnowledgeModel shortFormat = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API", ExtractionConfidence = 0.1 }],
        };

        ArchitectureKnowledgeModel longFormat = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API", ExtractionConfidence = 0.10 }],
        };

        ReviewCacheManifestBuilder.Build(request, shortFormat).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, longFormat).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_client_run_id_is_hyphens_only_vs_whitespace_only()
    {
        ClosedLoopReasoningRequest hyphensOnly = CreateRequest("Architecture note.");
        hyphensOnly.RunId = "----------------";

        ClosedLoopReasoningRequest whitespaceOnly = CreateRequest("Architecture note.");
        whitespaceOnly.RunId = "   \t  ";

        ClosedLoopReasoningRequest omitted = CreateRequest("Architecture note.");

        ReviewCacheManifestBuilder.Build(hyphensOnly).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(whitespaceOnly).ContentHash);
        ReviewCacheManifestBuilder.Build(hyphensOnly).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(omitted).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_request_framing_answer_keys_differ_only_by_casing_with_different_values_in_list_order()
    {
        ClosedLoopReasoningRequest costFirst = CreateRequest("Architecture note.");
        costFirst.FramingAnswers = new Dictionary<string, string>
        {
            ["Cost"] = "optimize",
            ["cost"] = "ignore",
        };

        ClosedLoopReasoningRequest lowerFirst = CreateRequest("Architecture note.");
        lowerFirst.FramingAnswers = new Dictionary<string, string>
        {
            ["cost"] = "ignore",
            ["Cost"] = "optimize",
        };

        ReviewCacheManifestBuilder.Build(costFirst).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(lowerFirst).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_request_framing_answer_value_is_whitespace_vs_empty_string()
    {
        ClosedLoopReasoningRequest whitespaceValue = CreateRequest("Architecture note.");
        whitespaceValue.FramingAnswers = new Dictionary<string, string> { ["cost"] = "   \t  " };

        ClosedLoopReasoningRequest emptyValue = CreateRequest("Architecture note.");
        emptyValue.FramingAnswers = new Dictionary<string, string> { ["cost"] = string.Empty };

        ClosedLoopReasoningRequest omitted = CreateRequest("Architecture note.");

        ReviewCacheManifestBuilder.Build(whitespaceValue).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(emptyValue).ContentHash);
        ReviewCacheManifestBuilder.Build(whitespaceValue).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(omitted).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_section_path_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-section-dotdot";

        ArchitectureKnowledgeModel collapsed = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "overview",
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel withDotDot = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "architecture/../overview",
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, collapsed).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, withDotDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_section_path_differs_only_by_leading_or_trailing_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-section-slash";

        ArchitectureKnowledgeModel bare = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "architecture/overview",
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel slashed = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "/architecture/overview/",
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, bare).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, slashed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_section_path_differs_only_by_backslash_vs_forward_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-section-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "architecture/overview",
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel backslash = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "architecture\\overview",
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_artifact_id_differs_only_by_backslash_vs_forward_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-artifact-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "docs/architecture/overview.md",
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel backslash = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "docs\\architecture\\overview.md",
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_artifact_id_differs_only_by_leading_dot_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-artifact-dot-slash";

        ArchitectureKnowledgeModel bare = new()
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
                        PassageLocator = new SourcePassageLocator { ArtifactId = "docs/arch.md" },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel dotSlash = new()
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
                        PassageLocator = new SourcePassageLocator { ArtifactId = "./docs/arch.md" },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, bare).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, dotSlash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_source_artifact_id_differs_only_by_backslash_vs_forward_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-source-artifact-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SourceArtifactId = "docs/architecture/overview.md" },
                },
            ],
        };

        ArchitectureKnowledgeModel backslash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SourceArtifactId = "docs\\architecture\\overview.md" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_artifact_id_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-artifact-dotdot";

        ArchitectureKnowledgeModel collapsed = new()
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
                        PassageLocator = new SourcePassageLocator { ArtifactId = "docs/overview.md" },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel withDotDot = new()
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
                        PassageLocator = new SourcePassageLocator { ArtifactId = "docs/architecture/../overview.md" },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, collapsed).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, withDotDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_source_passage_ids_differ_only_by_backslash_vs_forward_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-source-passage-id-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    SourcePassageIds = ["passages/architecture/overview"],
                },
            ],
        };

        ArchitectureKnowledgeModel backslash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    SourcePassageIds = ["passages\\architecture\\overview"],
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_related_element_ids_differ_only_by_backslash_vs_forward_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-related-id-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    RelatedElementIds = ["graph/nodes/api-gateway"],
                },
            ],
        };

        ArchitectureKnowledgeModel backslash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    RelatedElementIds = ["graph\\nodes\\api-gateway"],
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_evidence_ref_differs_only_by_backslash_vs_forward_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-evidence-backslash";

        TechnologyLedgerEntry forwardSlash = CreateLedgerEntry(request.RunId, evidenceRef: "evidence/architecture/overview.md");
        TechnologyLedgerEntry backslash = CreateLedgerEntry(request.RunId, evidenceRef: "evidence\\architecture\\overview.md");

        ReviewCacheManifestBuilder.Build(request, null, [forwardSlash]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [backslash]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_evidence_ref_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-evidence-dotdot";

        TechnologyLedgerEntry collapsed = CreateLedgerEntry(request.RunId, evidenceRef: "evidence/overview.md");
        TechnologyLedgerEntry withDotDot = CreateLedgerEntry(request.RunId, evidenceRef: "evidence/architecture/../overview.md");

        ReviewCacheManifestBuilder.Build(request, null, [collapsed]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [withDotDot]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_evidence_ref_differs_only_by_leading_dot_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-evidence-dot-slash";

        TechnologyLedgerEntry bare = CreateLedgerEntry(request.RunId, evidenceRef: "evidence/overview.md");
        TechnologyLedgerEntry dotSlash = CreateLedgerEntry(request.RunId, evidenceRef: "./evidence/overview.md");

        ReviewCacheManifestBuilder.Build(request, null, [bare]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [dotSlash]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_source_passage_ids_differ_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-source-passage-dotdot";

        ArchitectureKnowledgeModel collapsed = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    SourcePassageIds = ["passages/overview"],
                },
            ],
        };

        ArchitectureKnowledgeModel withDotDot = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    SourcePassageIds = ["passages/architecture/../overview"],
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, collapsed).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, withDotDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_related_element_ids_differ_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-related-dotdot";

        ArchitectureKnowledgeModel collapsed = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    RelatedElementIds = ["graph/api-gateway"],
                },
            ],
        };

        ArchitectureKnowledgeModel withDotDot = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    RelatedElementIds = ["graph/nodes/../api-gateway"],
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, collapsed).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, withDotDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_artifact_id_differs_only_by_double_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-artifact-double-slash";

        ArchitectureKnowledgeModel singleSlash = new()
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
                        PassageLocator = new SourcePassageLocator { ArtifactId = "docs/architecture/overview.md" },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel doubleSlash = new()
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
                        PassageLocator = new SourcePassageLocator { ArtifactId = "docs//architecture//overview.md" },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, singleSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, doubleSlash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_id_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-id-path-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "graph/nodes/api-gateway",
                    Name = "API",
                },
            ],
        };

        ArchitectureKnowledgeModel backslash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "graph\\nodes\\api-gateway",
                    Name = "API",
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_baseline_element_id_differs_only_by_interior_tab_in_segment()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-id-interior-tab-diff";

        ArchitectureKnowledgeModel tight = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "docs/document/gateway", Name = "API" }],
        };

        ArchitectureKnowledgeModel tabbed = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "docs/doc\tument/gateway", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, tight).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(request, tabbed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_id_differs_only_by_tab_characters_around_slashes()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-id-tab-slashes";

        ArchitectureKnowledgeModel tight = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "docs/architecture/gateway", Name = "API" }],
        };

        ArchitectureKnowledgeModel tabbed = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "docs\t/\tarchitecture\t/\tgateway", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, tight).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, tabbed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_id_differs_only_by_surrounding_whitespace_around_slashes()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-id-spaced-slashes";

        ArchitectureKnowledgeModel tight = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "docs/architecture/gateway", Name = "API" }],
        };

        ArchitectureKnowledgeModel spaced = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "docs / architecture / gateway", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, tight).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, spaced).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_id_differs_only_by_unicode_dot_homoglyph_parent_segment()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-id-dot-homoglyph";

        ArchitectureKnowledgeModel ascii = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "docs/acme/../reviews/gateway", Name = "API" }],
        };

        ArchitectureKnowledgeModel homoglyph = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "docs/acme/\uFF0E\uFF0E/reviews/gateway", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, homoglyph).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_id_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-id-dotdot";

        ArchitectureKnowledgeModel collapsed = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "graph/api-gateway", Name = "API" }],
        };

        ArchitectureKnowledgeModel withDotDot = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "graph/nodes/../api-gateway", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, collapsed).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, withDotDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_tenant_id_differs_only_by_backslash_vs_forward_slash_in_path_slug()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-tenant-path-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            TenantId = "tenants/acme/reviews",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel backslash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            TenantId = "tenants\\acme\\reviews",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_workspace_slug_differs_only_by_backslash_vs_forward_slash()
    {
        ClosedLoopReasoningRequest forwardSlash = CreateRequest("Architecture note.");
        forwardSlash.WorkspaceId = "teams/architecture/reviews";

        ClosedLoopReasoningRequest backslash = CreateRequest("Architecture note.");
        backslash.WorkspaceId = "teams\\architecture\\reviews";

        ReviewCacheManifestBuilder.Build(forwardSlash).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(backslash).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_project_slug_differs_only_by_backslash_vs_forward_slash()
    {
        ClosedLoopReasoningRequest forwardSlash = CreateRequest("Architecture note.");
        forwardSlash.ProjectId = "programs/cloud/migration";

        ClosedLoopReasoningRequest backslash = CreateRequest("Architecture note.");
        backslash.ProjectId = "programs\\cloud\\migration";

        ReviewCacheManifestBuilder.Build(forwardSlash).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(backslash).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_tenant_slug_differs_only_by_backslash_vs_forward_slash()
    {
        ClosedLoopReasoningRequest forwardSlash = CreateRequest("Architecture note.");
        forwardSlash.TenantId = "tenants/acme/reviews";

        ClosedLoopReasoningRequest backslash = CreateRequest("Architecture note.");
        backslash.TenantId = "tenants\\acme\\reviews";

        ReviewCacheManifestBuilder.Build(forwardSlash).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(backslash).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_workspace_slug_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest collapsed = CreateRequest("Architecture note.");
        collapsed.WorkspaceId = "teams/reviews";

        ClosedLoopReasoningRequest withDotDot = CreateRequest("Architecture note.");
        withDotDot.WorkspaceId = "teams/architecture/../reviews";

        ReviewCacheManifestBuilder.Build(collapsed).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(withDotDot).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_project_slug_differs_only_by_leading_dot_slash()
    {
        ClosedLoopReasoningRequest bare = CreateRequest("Architecture note.");
        bare.ProjectId = "programs/cloud/migration";

        ClosedLoopReasoningRequest dotSlash = CreateRequest("Architecture note.");
        dotSlash.ProjectId = "./programs/cloud/migration";

        ReviewCacheManifestBuilder.Build(bare).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(dotSlash).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_tenant_id_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-tenant-dotdot";

        ArchitectureKnowledgeModel collapsed = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            TenantId = "tenants/acme",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel withDotDot = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            TenantId = "tenants/org/../acme",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, collapsed).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, withDotDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_id_differs_only_by_leading_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-id-leading-slash";

        ArchitectureKnowledgeModel bare = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "graph/api-gateway", Name = "API" }],
        };

        ArchitectureKnowledgeModel leadingSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "/graph/api-gateway", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, bare).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, leadingSlash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_model_alias_id_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest forwardSlash = CreateRequest("Architecture note.");
        forwardSlash.ModelAliasId = "models/architecture/review";

        ClosedLoopReasoningRequest backslash = CreateRequest("Architecture note.");
        backslash.ModelAliasId = "models\\architecture\\review";

        ReviewCacheManifestBuilder.Build(forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_model_alias_id_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest collapsed = CreateRequest("Architecture note.");
        collapsed.ModelAliasId = "models/review";

        ClosedLoopReasoningRequest withDotDot = CreateRequest("Architecture note.");
        withDotDot.ModelAliasId = "models/architecture/../review";

        ReviewCacheManifestBuilder.Build(collapsed).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(withDotDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_model_alias_id_differs_only_by_leading_dot_slash()
    {
        ClosedLoopReasoningRequest bare = CreateRequest("Architecture note.");
        bare.ModelAliasId = "models/review";

        ClosedLoopReasoningRequest dotSlash = CreateRequest("Architecture note.");
        dotSlash.ModelAliasId = "./models/review";

        ReviewCacheManifestBuilder.Build(bare).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(dotSlash).ContentHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_tenant_slug_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest collapsed = CreateRequest("Architecture note.");
        collapsed.TenantId = "tenants/acme";

        ClosedLoopReasoningRequest withDotDot = CreateRequest("Architecture note.");
        withDotDot.TenantId = "tenants/org/../acme";

        ReviewCacheManifestBuilder.Build(collapsed).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(withDotDot).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_workspace_slug_differs_only_by_leading_slash()
    {
        ClosedLoopReasoningRequest bare = CreateRequest("Architecture note.");
        bare.WorkspaceId = "teams/architecture/reviews";

        ClosedLoopReasoningRequest leadingSlash = CreateRequest("Architecture note.");
        leadingSlash.WorkspaceId = "/teams/architecture/reviews";

        ReviewCacheManifestBuilder.Build(bare).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(leadingSlash).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_project_slug_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest collapsed = CreateRequest("Architecture note.");
        collapsed.ProjectId = "programs/migration";

        ClosedLoopReasoningRequest withDotDot = CreateRequest("Architecture note.");
        withDotDot.ProjectId = "programs/cloud/../migration";

        ReviewCacheManifestBuilder.Build(collapsed).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(withDotDot).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_request_source_file_name_differs_only_by_unicode_dot_homoglyph_parent_segment()
    {
        ClosedLoopReasoningRequest ascii = CreateRequest("Same body.");
        ascii.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/acme/../reviews/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest homoglyph = CreateRequest("Same body.");
        homoglyph.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/acme/\uFF0E\uFF0E/reviews/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(homoglyph).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_request_source_file_name_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest collapsed = CreateRequest("Architecture note.");
        collapsed.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/overview.md",
                ContentType = "text/markdown",
                Content = "Architecture note.",
            },
        ];

        ClosedLoopReasoningRequest withDotDot = CreateRequest("Architecture note.");
        withDotDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/../overview.md",
                ContentType = "text/markdown",
                Content = "Architecture note.",
            },
        ];

        ReviewCacheManifestBuilder.Build(collapsed).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(withDotDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_property_value_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-property-value-path-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["repo"] = "github.com/org/service/api" },
                },
            ],
        };

        ArchitectureKnowledgeModel backslash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["repo"] = "github.com\\org\\service\\api" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_property_key_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-property-key-path-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["metadata/docs/readme"] = "value" },
                },
            ],
        };

        ArchitectureKnowledgeModel backslash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["metadata\\docs\\readme"] = "value" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_property_value_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-property-value-dotdot";

        ArchitectureKnowledgeModel collapsed = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["repo"] = "github.com/org/api" },
                },
            ],
        };

        ArchitectureKnowledgeModel withDotDot = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Properties = new Dictionary<string, string> { ["repo"] = "github.com/org/service/../api" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, collapsed).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, withDotDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_framing_answer_value_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-framing-value-path-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["evidence"] = "docs/architecture/overview.md" },
        };

        ArchitectureKnowledgeModel backslash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["evidence"] = "docs\\architecture\\overview.md" },
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_request_framing_answer_value_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest forwardSlash = CreateRequest("Architecture note.");
        forwardSlash.FramingAnswers = new Dictionary<string, string> { ["evidence"] = "docs/architecture/overview.md" };

        ClosedLoopReasoningRequest backslash = CreateRequest("Architecture note.");
        backslash.FramingAnswers = new Dictionary<string, string> { ["evidence"] = "docs\\architecture\\overview.md" };

        ReviewCacheManifestBuilder.Build(forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_request_framing_answer_key_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest forwardSlash = CreateRequest("Architecture note.");
        forwardSlash.FramingAnswers = new Dictionary<string, string> { ["questions/cost/driver"] = "optimize" };

        ClosedLoopReasoningRequest backslash = CreateRequest("Architecture note.");
        backslash.FramingAnswers = new Dictionary<string, string> { ["questions\\cost\\driver"] = "optimize" };

        ReviewCacheManifestBuilder.Build(forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_notes_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-provenance-notes-path-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Notes = "see docs/architecture/overview.md" },
                },
            ],
        };

        ArchitectureKnowledgeModel backslash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Notes = "see docs\\architecture\\overview.md" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_quote_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-quote-path-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            Quote = "docs/architecture/overview.md",
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel backslash = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            Quote = "docs\\architecture\\overview.md",
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_declared_priorities_differ_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-priority-path-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            DeclaredPriorities = ["goals/cost/performance"],
        };

        ArchitectureKnowledgeModel backslash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            DeclaredPriorities = ["goals\\cost\\performance"],
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_declared_priorities_hash_when_request_priorities_differ_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest forwardSlash = CreateRequest("Architecture note.");
        forwardSlash.DeclaredPriorities = ["goals/cost/performance"];

        ClosedLoopReasoningRequest backslash = CreateRequest("Architecture note.");
        backslash.DeclaredPriorities = ["goals\\cost\\performance"];

        ReviewCacheManifestBuilder.Build(forwardSlash).DeclaredPrioritiesHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(backslash).DeclaredPrioritiesHash);
    }

    [Fact]
    public void Build_matches_declared_priorities_hash_when_request_priorities_differ_only_by_leading_dot_slash()
    {
        ClosedLoopReasoningRequest dotted = CreateRequest("Architecture note.");
        dotted.DeclaredPriorities = ["./goals/cost/performance"];

        ClosedLoopReasoningRequest plain = CreateRequest("Architecture note.");
        plain.DeclaredPriorities = ["goals/cost/performance"];

        ReviewCacheManifestBuilder.Build(dotted).DeclaredPrioritiesHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(plain).DeclaredPrioritiesHash);
    }

    [Fact]
    public void Build_matches_declared_priorities_hash_when_request_priorities_differ_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest dotted = CreateRequest("Architecture note.");
        dotted.DeclaredPriorities = ["goals/acme/../cost/performance"];

        ClosedLoopReasoningRequest collapsed = CreateRequest("Architecture note.");
        collapsed.DeclaredPriorities = ["goals/cost/performance"];

        ReviewCacheManifestBuilder.Build(dotted).DeclaredPrioritiesHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(collapsed).DeclaredPrioritiesHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_request_framing_answer_key_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest dotted = CreateRequest("Architecture note.");
        dotted.FramingAnswers = new Dictionary<string, string> { ["questions/acme/../cost/driver"] = "optimize" };

        ClosedLoopReasoningRequest collapsed = CreateRequest("Architecture note.");
        collapsed.FramingAnswers = new Dictionary<string, string> { ["questions/cost/driver"] = "optimize" };

        ReviewCacheManifestBuilder.Build(dotted).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(collapsed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_declared_priorities_differ_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-priority-dot-dot";

        ArchitectureKnowledgeModel dotted = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            DeclaredPriorities = ["goals/acme/../cost/performance"],
        };

        ArchitectureKnowledgeModel collapsed = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            DeclaredPriorities = ["goals/cost/performance"],
        };

        ReviewCacheManifestBuilder.Build(request, dotted).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, collapsed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_framing_answer_key_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-framing-key-path-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["questions/cost/driver"] = "optimize" },
        };

        ArchitectureKnowledgeModel backslash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["questions\\cost\\driver"] = "optimize" },
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_name_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-name-path-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "services/api/gateway" }],
        };

        ArchitectureKnowledgeModel backslash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "services\\api\\gateway" }],
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_description_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-description-path-backslash";

        ArchitectureKnowledgeModel forwardSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Description = "docs/architecture/overview.md",
                },
            ],
        };

        ArchitectureKnowledgeModel backslash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Description = "docs\\architecture\\overview.md",
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_related_element_ids_differ_only_by_leading_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-related-leading-slash";

        ArchitectureKnowledgeModel bare = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    RelatedElementIds = ["graph/api-gateway"],
                },
            ],
        };

        ArchitectureKnowledgeModel leadingSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    RelatedElementIds = ["/graph/api-gateway"],
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, bare).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, leadingSlash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_source_passage_ids_differ_only_by_leading_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-source-passage-leading-slash";

        ArchitectureKnowledgeModel bare = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    SourcePassageIds = ["passages/overview"],
                },
            ],
        };

        ArchitectureKnowledgeModel leadingSlash = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    SourcePassageIds = ["/passages/overview"],
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, bare).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, leadingSlash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_request_source_file_name_differs_only_by_backslash_vs_forward_slash()
    {
        ClosedLoopReasoningRequest forwardSlash = CreateRequest("Architecture note.");
        forwardSlash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Architecture note.",
            },
        ];

        ClosedLoopReasoningRequest backslash = CreateRequest("Architecture note.");
        backslash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\\architecture\\overview.md",
                ContentType = "text/markdown",
                Content = "Architecture note.",
            },
        ];

        ReviewCacheManifestBuilder.Build(forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_source_artifact_id_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-source-artifact-dotdot";

        ArchitectureKnowledgeModel collapsed = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SourceArtifactId = "docs/overview.md" },
                },
            ],
        };

        ArchitectureKnowledgeModel withDotDot = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SourceArtifactId = "docs/architecture/../overview.md" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, collapsed).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, withDotDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_section_path_differs_only_by_consecutive_spaces()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-section-double-space";

        ArchitectureKnowledgeModel singleSpace = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "architecture overview",
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel doubleSpace = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "architecture  overview",
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, singleSpace).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, doubleSpace).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_framing_answers_are_empty_vs_omitted()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-framing-empty-omitted";

        ArchitectureKnowledgeModel emptyFraming = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string>(),
        };

        ArchitectureKnowledgeModel omittedFraming = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
        };

        ReviewCacheManifestBuilder.Build(request, emptyFraming).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, omittedFraming).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_technology_ledger_is_null_vs_empty_list()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-null-empty";

        ReviewCacheManifestBuilder.Build(request, baselineKnowledgeModel: new ArchitectureKnowledgeModel { ModelId = "m", RunId = request.RunId }, technologyLedgerEntries: null)
            .ContentHash
            .Should()
            .Be(
                ReviewCacheManifestBuilder.Build(
                        request,
                        baselineKnowledgeModel: new ArchitectureKnowledgeModel { ModelId = "m", RunId = request.RunId },
                        technologyLedgerEntries: [])
                    .ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_duplicate_element_ids_differ_only_by_provenance_support_status_list_order()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-duplicate-provenance-support";

        ArchitectureKnowledgeModel unsupportedFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SupportStatus = SupportStatus.Unsupported },
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SupportStatus = SupportStatus.DirectlyEstablished },
                },
            ],
        };

        ArchitectureKnowledgeModel establishedFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SupportStatus = SupportStatus.DirectlyEstablished },
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { SupportStatus = SupportStatus.Unsupported },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, unsupportedFirst).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, establishedFirst).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_source_content_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest lower = CreateRequest("public api gateway");
        ClosedLoopReasoningRequest upper = CreateRequest("Public API Gateway");

        ReviewCacheManifestBuilder.Build(lower).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(upper).ContentHash);
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
    public void Build_matches_content_hash_when_file_name_differs_only_by_tab_characters_around_slashes()
    {
        ClosedLoopReasoningRequest tight = CreateRequest("Same body.");
        tight.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest tabbed = CreateRequest("Same body.");
        tabbed.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\t/\tarchitecture\t/\toverview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(tight).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(tabbed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_surrounding_whitespace_around_slashes()
    {
        ClosedLoopReasoningRequest tight = CreateRequest("Same body.");
        tight.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest spaced = CreateRequest("Same body.");
        spaced.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs / architecture / overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(tight).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(spaced).ContentHash);
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
    public void Build_matches_content_hash_when_file_name_differs_only_by_unicode_division_slash()
    {
        ClosedLoopReasoningRequest ascii = CreateRequest("Same body.");
        ascii.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest unicode = CreateRequest("Same body.");
        unicode.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2215architecture\u2215overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(unicode).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fullwidth_slash()
    {
        ClosedLoopReasoningRequest ascii = CreateRequest("Same body.");
        ascii.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fullwidth = CreateRequest("Same body.");
        fullwidth.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\uFF0Farchitecture\uFF0Foverview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fullwidth).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fraction_slash()
    {
        ClosedLoopReasoningRequest ascii = CreateRequest("Same body.");
        ascii.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fraction = CreateRequest("Same body.");
        fraction.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2044architecture\u2044overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fraction).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_ideographic_full_stop_parent_segment()
    {
        ClosedLoopReasoningRequest ascii = CreateRequest("Same body.");
        ascii.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/acme/../reviews/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest homoglyph = CreateRequest("Same body.");
        homoglyph.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/acme/\u3002\u3002/reviews/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(homoglyph).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_big_reverse_solidus_slash()
    {
        ClosedLoopReasoningRequest ascii = CreateRequest("Same body.");
        ascii.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest bigReverse = CreateRequest("Same body.");
        bigReverse.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u29F9architecture\u29F9overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(bigReverse).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_mathematical_rising_diagonal_slash()
    {
        ClosedLoopReasoningRequest ascii = CreateRequest("Same body.");
        ascii.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest risingDiagonal = CreateRequest("Same body.");
        risingDiagonal.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u27CBarchitecture\u27CBoverview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(risingDiagonal).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_halfwidth_ideographic_full_stop_parent_segment()
    {
        ClosedLoopReasoningRequest ascii = CreateRequest("Same body.");
        ascii.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/acme/../reviews/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest homoglyph = CreateRequest("Same body.");
        homoglyph.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/acme/\uFF61\uFF61/reviews/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(homoglyph).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_big_solidus_slash()
    {
        ClosedLoopReasoningRequest ascii = CreateRequest("Same body.");
        ascii.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest bigSolidus = CreateRequest("Same body.");
        bigSolidus.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u29F8architecture\u29F8overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(bigSolidus).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_box_drawings_slash()
    {
        ClosedLoopReasoningRequest ascii = CreateRequest("Same body.");
        ascii.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest boxDrawing = CreateRequest("Same body.");
        boxDrawing.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2571architecture\u2571overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(boxDrawing).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fullwidth_reverse_solidus()
    {
        ClosedLoopReasoningRequest ascii = CreateRequest("Same body.");
        ascii.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fullwidthBackslash = CreateRequest("Same body.");
        fullwidthBackslash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\uFF3Carchitecture\uFF3Coverview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fullwidthBackslash).ContentHash);
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
    public void BuildContinueFromExistingRunCoalesceManifest_matches_hash_when_tenant_slug_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.ContinueFromExistingRun = true;

        ReviewCacheDependencyManifest lowerTenant =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-slug",
                "run-continue");

        ReviewCacheDependencyManifest upperTenant =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "Tenant-Slug",
                "run-continue");

        lowerTenant.ContentHash.Should().Be(upperTenant.ContentHash);
    }

    [Fact]
    public void BuildContinueFromExistingRunCoalesceManifest_matches_hash_when_run_id_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.ContinueFromExistingRun = true;

        ReviewCacheDependencyManifest lowerRun =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-cache",
                "run-continue");

        ReviewCacheDependencyManifest upperRun =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-cache",
                "RUN-CONTINUE");

        lowerRun.ContentHash.Should().Be(upperRun.ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_client_run_id_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest lower = CreateRequest("Architecture note.");
        lower.RunId = "run-continue";

        ClosedLoopReasoningRequest upper = CreateRequest("Architecture note.");
        upper.RunId = "RUN-CONTINUE";

        ReviewCacheManifestBuilder.Build(lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_client_run_id_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest forwardSlash = CreateRequest("Architecture note.");
        forwardSlash.RunId = "tenants/acme/runs/42";

        ClosedLoopReasoningRequest backslash = CreateRequest("Architecture note.");
        backslash.RunId = "tenants\\acme\\runs\\42";

        ReviewCacheManifestBuilder.Build(forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_client_run_id_differs_only_by_surrounding_whitespace_around_slashes_in_path()
    {
        ClosedLoopReasoningRequest tight = CreateRequest("Architecture note.");
        tight.RunId = "tenants/acme/runs/42";

        ClosedLoopReasoningRequest spaced = CreateRequest("Architecture note.");
        spaced.RunId = "tenants / acme / runs / 42";

        ReviewCacheManifestBuilder.Build(tight).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(spaced).ContentHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_tenant_slug_differs_only_by_surrounding_whitespace_around_slashes()
    {
        ClosedLoopReasoningRequest tight = CreateRequest("Architecture note.");
        tight.TenantId = "tenants/acme/reviews";

        ClosedLoopReasoningRequest spaced = CreateRequest("Architecture note.");
        spaced.TenantId = "tenants / acme / reviews";

        ReviewCacheManifestBuilder.Build(tight).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(spaced).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_evidence_ref_differs_only_by_surrounding_whitespace_around_slashes()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-evidence-spaced-slashes";

        TechnologyLedgerEntry tight = CreateLedgerEntry(request.RunId, evidenceRef: "docs/architecture/overview.md");
        TechnologyLedgerEntry spaced = CreateLedgerEntry(request.RunId, evidenceRef: "docs / architecture / overview.md");

        ReviewCacheManifestBuilder.Build(request, null, [tight]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [spaced]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_plus_sign_vs_encoded_space_before_slash()
    {
        ClosedLoopReasoningRequest literal = CreateRequest("Same body.");
        literal.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest plus = CreateRequest("Same body.");
        plus.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs+architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(literal).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(plus).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_line_feed_vs_slash_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest lineFeed = CreateRequest("Same body.");
        lineFeed.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\narchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(lineFeed).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_interior_line_feed_in_segment()
    {
        ClosedLoopReasoningRequest tight = CreateRequest("Same body.");
        tight.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest broken = CreateRequest("Same body.");
        broken.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch\nitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(tight).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(broken).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_line_feed_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%0Aarchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_crlf_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%0D%0Aarchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_tab_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest tabbed = CreateRequest("Same body.");
        tabbed.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\tarchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(tabbed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_tab_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%09architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_carriage_return_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%0Darchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_line_feed_double_encoded()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%250Aarchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_narrow_nbsp_between_segments_without_slash()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest nbsp = CreateRequest("Same body.");
        nbsp.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u00a0architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(nbsp).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_nbsp_between_segments_without_slash()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%C2%A0architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_narrow_no_break_space_between_segments_without_slash()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest narrow = CreateRequest("Same body.");
        narrow.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u202farchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(narrow).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_ideographic_space_between_segments_without_slash()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest ideographic = CreateRequest("Same body.");
        ideographic.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u3000architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(ideographic).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_semicolon_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest semicolon = CreateRequest("Same body.");
        semicolon.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs;architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(semicolon).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_pipe_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest pipe = CreateRequest("Same body.");
        pipe.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs|architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(pipe).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_comma_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest comma = CreateRequest("Same body.");
        comma.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs,architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(comma).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_semicolon_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%3Barchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fullwidth_semicolon_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fullwidth = CreateRequest("Same body.");
        fullwidth.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\uFF1Barchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fullwidth).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fullwidth_vertical_line_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fullwidth = CreateRequest("Same body.");
        fullwidth.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\uFF5Carchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fullwidth).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fullwidth_comma_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fullwidth = CreateRequest("Same body.");
        fullwidth.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\uFF0Carchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fullwidth).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_pipe_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%7Carchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_comma_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%2Carchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_ideographic_space_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%E3%80%80architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_ampersand_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest ampersand = CreateRequest("Same body.");
        ampersand.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs&architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(ampersand).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_ampersand_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%26architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_greater_than_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest greaterThan = CreateRequest("Same body.");
        greaterThan.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs>architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(greaterThan).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_file_uri_scheme_prefix()
    {
        ClosedLoopReasoningRequest plain = CreateRequest("Same body.");
        plain.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fileUri = CreateRequest("Same body.");
        fileUri.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "file://docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(plain).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fileUri).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_url_query_suffix()
    {
        ClosedLoopReasoningRequest plain = CreateRequest("Same body.");
        plain.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest withQuery = CreateRequest("Same body.");
        withQuery.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md?version=1",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(plain).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(withQuery).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_url_fragment_suffix()
    {
        ClosedLoopReasoningRequest plain = CreateRequest("Same body.");
        plain.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest withFragment = CreateRequest("Same body.");
        withFragment.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md#section",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(plain).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(withFragment).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_https_url_with_authority_prefix()
    {
        ClosedLoopReasoningRequest plain = CreateRequest("Same body.");
        plain.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest https = CreateRequest("Same body.");
        https.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "https://example.com/docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(plain).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(https).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_file_uri_scheme()
    {
        ClosedLoopReasoningRequest plain = CreateRequest("Same body.");
        plain.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "file%3A%2F%2Fdocs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(plain).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fullwidth_greater_than_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fullwidth = CreateRequest("Same body.");
        fullwidth.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\uFF1Earchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fullwidth).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_http_url_with_authority_prefix()
    {
        ClosedLoopReasoningRequest plain = CreateRequest("Same body.");
        plain.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest http = CreateRequest("Same body.");
        http.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "http://example.com/docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(plain).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(http).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_protocol_relative_url_with_authority_prefix()
    {
        ClosedLoopReasoningRequest plain = CreateRequest("Same body.");
        plain.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest protocolRelative = CreateRequest("Same body.");
        protocolRelative.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "//example.com/docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(plain).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(protocolRelative).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fully_percent_encoded_https_url()
    {
        ClosedLoopReasoningRequest plain = CreateRequest("Same body.");
        plain.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "https%3A%2F%2Fexample.com%2Fdocs%2Farchitecture%2Foverview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(plain).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_protocol_relative_url()
    {
        ClosedLoopReasoningRequest plain = CreateRequest("Same body.");
        plain.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "%2F%2Fexample.com%2Fdocs%2Farchitecture%2Foverview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(plain).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_ip_literal_protocol_relative_url()
    {
        ClosedLoopReasoningRequest plain = CreateRequest("Same body.");
        plain.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest ipLiteral = CreateRequest("Same body.");
        ipLiteral.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "//127.0.0.1/docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(plain).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(ipLiteral).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_https_url_with_explicit_port()
    {
        ClosedLoopReasoningRequest plain = CreateRequest("Same body.");
        plain.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest withPort = CreateRequest("Same body.");
        withPort.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "https://example.com:8443/docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(plain).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(withPort).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_colon_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest colon = CreateRequest("Same body.");
        colon.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs:architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(colon).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_colon_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest colon = CreateRequest("Same body.");
        colon.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch:note.md/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(colon).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_ipv6_literal_protocol_relative_url()
    {
        ClosedLoopReasoningRequest plain = CreateRequest("Same body.");
        plain.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest ipv6 = CreateRequest("Same body.");
        ipv6.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "//[::1]/docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(plain).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(ipv6).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_colon_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%3Aarchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_triple_slash_segment()
    {
        ClosedLoopReasoningRequest single = CreateRequest("Same body.");
        single.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest triple = CreateRequest("Same body.");
        triple.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs///architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(single).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(triple).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_leading_double_slash()
    {
        ClosedLoopReasoningRequest single = CreateRequest("Same body.");
        single.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest leadingDouble = CreateRequest("Same body.");
        leadingDouble.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "//docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(single).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(leadingDouble).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_client_run_id_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest dotted = CreateRequest("Architecture note.");
        dotted.RunId = "tenants/acme/runs/../reviews/42";

        ClosedLoopReasoningRequest collapsed = CreateRequest("Architecture note.");
        collapsed.RunId = "tenants/acme/reviews/42";

        ReviewCacheManifestBuilder.Build(dotted).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(collapsed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_request_framing_answer_key_differs_only_by_leading_dot_slash()
    {
        ClosedLoopReasoningRequest dotted = CreateRequest("Architecture note.");
        dotted.FramingAnswers = new Dictionary<string, string> { ["./questions/cost/driver"] = "optimize" };

        ClosedLoopReasoningRequest plain = CreateRequest("Architecture note.");
        plain.FramingAnswers = new Dictionary<string, string> { ["questions/cost/driver"] = "optimize" };

        ReviewCacheManifestBuilder.Build(dotted).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(plain).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_framing_answer_key_differs_only_by_casing_on_model()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-framing-key-casing-model";

        ArchitectureKnowledgeModel lower = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["business-outcome"] = "Secure intake." },
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel upper = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["Business-Outcome"] = "Secure intake." },
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
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
    public void Build_changes_content_hash_when_continue_from_existing_flag_is_set()
    {
        ClosedLoopReasoningRequest withoutFlag = CreateRequest("Architecture note.");
        withoutFlag.RunId = "run-continue-flag";

        ClosedLoopReasoningRequest withFlag = CreateRequest("Architecture note.");
        withFlag.RunId = "run-continue-flag";
        withFlag.ContinueFromExistingRun = true;

        ReviewCacheManifestBuilder.Build(withoutFlag).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(withFlag).ContentHash);
    }

    [Fact]
    public void BuildContinueFromExistingRunCoalesceManifest_matches_when_rebuilt_with_same_ledger_snapshot()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.ContinueFromExistingRun = true;
        request.RunId = "run-ledger-stable";

        ArchitectureKnowledgeModel baseline = new()
        {
            ModelId = "model-ledger-stable",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        List<TechnologyLedgerEntry> ledger = [CreateLedgerEntry(request.RunId, "evidence-ledger-stable")];

        ReviewCacheDependencyManifest first =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-ledger-stable",
                request.RunId,
                baseline,
                ledger);

        ReviewCacheDependencyManifest second =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-ledger-stable",
                request.RunId,
                baseline,
                ledger);

        second.ContentHash.Should().Be(first.ContentHash);
    }

    [Fact]
    public void BuildContinueFromExistingRunCoalesceManifest_changes_hash_when_ledger_snapshot_changes()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.ContinueFromExistingRun = true;
        request.RunId = "run-ledger-change";

        ArchitectureKnowledgeModel baseline = new()
        {
            ModelId = "model-ledger-change",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheDependencyManifest beforeLedger =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-ledger-change",
                request.RunId,
                baseline,
                technologyLedgerEntries: []);

        ReviewCacheDependencyManifest afterLedger =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-ledger-change",
                request.RunId,
                baseline,
                [CreateLedgerEntry(request.RunId, "evidence-ledger-change")]);

        afterLedger.ContentHash.Should().NotBe(beforeLedger.ContentHash);
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
    public void Build_matches_content_hash_when_ledger_contains_duplicate_identical_entries()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-duplicate-rows";

        TechnologyLedgerEntry entry = CreateLedgerEntry(request.RunId, evidenceRef: "evidence:shared");

        ReviewCacheManifestBuilder.Build(request, null, [entry, entry]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [entry]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_technology_name_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-technology-path-backslash";

        TechnologyLedgerEntry forwardSlash = CreateLedgerEntry(request.RunId, evidenceRef: "evidence:shared");
        forwardSlash.TechnologyName = "docs/architecture/overview.md";

        TechnologyLedgerEntry backslash = CreateLedgerEntry(request.RunId, evidenceRef: "evidence:shared");
        backslash.TechnologyName = "docs\\architecture\\overview.md";

        ReviewCacheManifestBuilder.Build(request, null, [forwardSlash]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [backslash]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_technology_name_differs_only_by_leading_dot_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-technology-leading-dot";

        TechnologyLedgerEntry dotted = CreateLedgerEntry(request.RunId, evidenceRef: "evidence:shared");
        dotted.TechnologyName = "./docs/architecture/overview.md";

        TechnologyLedgerEntry plain = CreateLedgerEntry(request.RunId, evidenceRef: "evidence:shared");
        plain.TechnologyName = "docs/architecture/overview.md";

        ReviewCacheManifestBuilder.Build(request, null, [dotted]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [plain]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_technology_name_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-technology-dot-dot";

        TechnologyLedgerEntry dotted = CreateLedgerEntry(request.RunId, evidenceRef: "evidence:shared");
        dotted.TechnologyName = "docs/acme/../architecture/overview.md";

        TechnologyLedgerEntry collapsed = CreateLedgerEntry(request.RunId, evidenceRef: "evidence:shared");
        collapsed.TechnologyName = "docs/architecture/overview.md";

        ReviewCacheManifestBuilder.Build(request, null, [dotted]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [collapsed]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_request_framing_answer_value_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest dotted = CreateRequest("Architecture note.");
        dotted.FramingAnswers = new Dictionary<string, string> { ["evidence"] = "docs/acme/../architecture/overview.md" };

        ClosedLoopReasoningRequest collapsed = CreateRequest("Architecture note.");
        collapsed.FramingAnswers = new Dictionary<string, string> { ["evidence"] = "docs/architecture/overview.md" };

        ReviewCacheManifestBuilder.Build(dotted).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(collapsed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_evidence_ref_differs_only_by_percent_encoded_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-evidence-percent-slash";

        TechnologyLedgerEntry slash = CreateLedgerEntry(request.RunId, evidenceRef: "docs/architecture/overview.md");
        TechnologyLedgerEntry encoded = CreateLedgerEntry(request.RunId, evidenceRef: "docs%2Farchitecture%2Foverview.md");

        ReviewCacheManifestBuilder.Build(request, null, [slash]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [encoded]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_artifact_id_differs_only_by_percent_encoded_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-artifact-percent-slash";

        ArchitectureKnowledgeModel slash = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "docs/architecture/overview.md",
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel encoded = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "docs%2Farchitecture%2Foverview.md",
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_evidence_ref_differs_only_by_percent_encoded_backslash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-evidence-percent-backslash";

        TechnologyLedgerEntry slash = CreateLedgerEntry(request.RunId, evidenceRef: "docs/architecture/overview.md");
        TechnologyLedgerEntry encoded = CreateLedgerEntry(request.RunId, evidenceRef: "docs%5Carchitecture%5Coverview.md");

        ReviewCacheManifestBuilder.Build(request, null, [slash]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [encoded]).ContentHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_tenant_slug_differs_only_by_percent_encoded_slash()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Architecture note.");
        slash.TenantId = "tenants/acme/reviews";

        ClosedLoopReasoningRequest encoded = CreateRequest("Architecture note.");
        encoded.TenantId = "tenants%2Facme%2Freviews";

        ReviewCacheManifestBuilder.Build(slash).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).TenantConfigurationHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_request_framing_answer_keys_differ_only_by_percent_encoded_slash_in_path()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Architecture note.");
        slash.FramingAnswers = new Dictionary<string, string> { ["questions/cost/driver"] = "optimize" };

        ClosedLoopReasoningRequest encoded = CreateRequest("Architecture note.");
        encoded.FramingAnswers = new Dictionary<string, string> { ["questions%2Fcost%2Fdriver"] = "optimize" };

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_request_framing_answers_include_path_equivalent_keys_differing_only_by_percent_encoding()
    {
        ClosedLoopReasoningRequest slashKey = CreateRequest("Architecture note.");
        slashKey.FramingAnswers = new Dictionary<string, string> { ["questions/cost/driver"] = "optimize" };

        ClosedLoopReasoningRequest encodedKey = CreateRequest("Architecture note.");
        encodedKey.FramingAnswers = new Dictionary<string, string>
        {
            ["questions/cost/driver"] = "optimize",
            ["questions%2Fcost%2Fdriver"] = "ignore",
        };

        ReviewCacheManifestBuilder.Build(slashKey).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encodedKey).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_artifact_id_differs_only_by_big_solidus_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-artifact-big-solidus";

        ArchitectureKnowledgeModel ascii = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "docs/architecture/overview.md",
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel bigSolidus = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "docs\u29F8architecture\u29F8overview.md",
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, bigSolidus).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_id_differs_only_by_ideographic_full_stop_parent_segment()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-id-ideographic-dot";

        ArchitectureKnowledgeModel ascii = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "docs/acme/../reviews/gateway", Name = "API" }],
        };

        ArchitectureKnowledgeModel homoglyph = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "docs/acme/\u3002\u3002/reviews/gateway", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, homoglyph).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_artifact_id_differs_only_by_fullwidth_reverse_solidus()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-artifact-fullwidth-backslash";

        ArchitectureKnowledgeModel ascii = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "docs/architecture/overview.md",
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel fullwidthBackslash = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "docs\uFF3Carchitecture\uFF3Coverview.md",
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, fullwidthBackslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_artifact_id_differs_only_by_fraction_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-artifact-fraction-slash";

        ArchitectureKnowledgeModel ascii = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "docs/architecture/overview.md",
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel fraction = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "docs\u2044architecture\u2044overview.md",
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, fraction).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_artifact_id_differs_only_by_unicode_division_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-passage-artifact-unicode-slash";

        ArchitectureKnowledgeModel ascii = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "docs/architecture/overview.md",
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel unicode = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "docs\u2215architecture\u2215overview.md",
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, unicode).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_evidence_ref_differs_only_by_double_percent_encoded_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-evidence-double-percent";

        TechnologyLedgerEntry slash = CreateLedgerEntry(request.RunId, evidenceRef: "docs/architecture/overview.md");
        TechnologyLedgerEntry encoded = CreateLedgerEntry(request.RunId, evidenceRef: "docs%252Farchitecture%252Foverview.md");

        ReviewCacheManifestBuilder.Build(request, null, [slash]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [encoded]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_ledger_evidence_ref_differs_only_by_unicode_division_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-evidence-unicode-slash";

        TechnologyLedgerEntry ascii = CreateLedgerEntry(request.RunId, evidenceRef: "docs/architecture/overview.md");
        TechnologyLedgerEntry unicode = CreateLedgerEntry(request.RunId, evidenceRef: "docs\u2215architecture\u2215overview.md");

        ReviewCacheManifestBuilder.Build(request, null, [ascii]).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, [unicode]).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_provenance_passage_section_path_differs_only_by_unicode_division_slash()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-section-unicode-slash";

        ArchitectureKnowledgeModel ascii = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "docs/architecture/overview",
                        },
                    },
                },
            ],
        };

        ArchitectureKnowledgeModel unicode = new()
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
                        PassageLocator = new SourcePassageLocator
                        {
                            ArtifactId = "artifact-1",
                            SectionPath = "docs\u2215architecture\u2215overview",
                        },
                    },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, ascii).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, unicode).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_framing_answer_key_differs_only_by_dot_dot_slash_segment()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-framing-key-dot-dot";

        ArchitectureKnowledgeModel dotted = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["questions/acme/../cost/driver"] = "optimize" },
        };

        ArchitectureKnowledgeModel collapsed = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            FramingAnswers = new Dictionary<string, string> { ["questions/cost/driver"] = "optimize" },
        };

        ReviewCacheManifestBuilder.Build(request, dotted).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, collapsed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_element_ids_differ_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-element-id-casing";

        ArchitectureKnowledgeModel lower = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel upper = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "EL-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_elements_include_duplicate_element_ids_differing_only_by_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-duplicate-element-id-casing";

        ArchitectureKnowledgeModel lowerFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement { ElementId = "el-1", Name = "API" },
                new ArchitectureModelElement { ElementId = "EL-1", Name = "API" },
            ],
        };

        ArchitectureKnowledgeModel upperFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement { ElementId = "EL-1", Name = "API" },
                new ArchitectureModelElement { ElementId = "el-1", Name = "API" },
            ],
        };

        ArchitectureKnowledgeModel canonical = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, lowerFirst).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, upperFirst).ContentHash)
            .And.Be(ReviewCacheManifestBuilder.Build(request, canonical).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_duplicate_element_ids_differ_only_by_provenance_notes_list_order()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-duplicate-element-provenance-notes";

        ArchitectureKnowledgeModel alphaFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Notes = "alpha" },
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Notes = "beta" },
                },
            ],
        };

        ArchitectureKnowledgeModel betaFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Notes = "beta" },
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    Provenance = new ClaimProvenance { Notes = "alpha" },
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, alphaFirst).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, betaFirst).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_duplicate_element_ids_differ_only_by_lifecycle_scope_list_order()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-model-duplicate-element-lifecycle";

        ArchitectureKnowledgeModel currentFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    LifecycleScope = ArchitectureLifecycleScope.CurrentState,
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    LifecycleScope = ArchitectureLifecycleScope.TargetState,
                },
            ],
        };

        ArchitectureKnowledgeModel targetFirst = new()
        {
            ModelId = "model-1",
            RunId = request.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    LifecycleScope = ArchitectureLifecycleScope.TargetState,
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Name = "API",
                    LifecycleScope = ArchitectureLifecycleScope.CurrentState,
                },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, currentFirst).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, targetFirst).ContentHash);
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

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_equals_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest equalsBeforeDot = CreateRequest("Same body.");
        equalsBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs=architecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(equalsBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fullwidth_equals_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fullwidth = CreateRequest("Same body.");
        fullwidth.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\uFF1Darchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fullwidth).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_equals_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%3Darchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_exclamation_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest bangBeforeDot = CreateRequest("Same body.");
        bangBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs!architecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(bangBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_at_sign_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest atBeforeDot = CreateRequest("Same body.");
        atBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs@architecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(atBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fullwidth_exclamation_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fullwidth = CreateRequest("Same body.");
        fullwidth.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\uFF01architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fullwidth).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_exclamation_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%21architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fullwidth_at_sign_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fullwidth = CreateRequest("Same body.");
        fullwidth.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\uFF20architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fullwidth).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_at_sign_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%40architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_exclamation_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest bang = CreateRequest("Same body.");
        bang.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs!architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(bang).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_at_sign_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest atSign = CreateRequest("Same body.");
        atSign.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs@architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(atSign).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_equals_sign_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest equalsSign = CreateRequest("Same body.");
        equalsSign.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs=architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(equalsSign).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_https_url_with_userinfo_prefix()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest userInfo = CreateRequest("Same body.");
        userInfo.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "https://user@example.com/docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(userInfo).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_tilde_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest tildeBeforeDot = CreateRequest("Same body.");
        tildeBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs~architecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(tildeBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_caret_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest caretBeforeDot = CreateRequest("Same body.");
        caretBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs^architecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(caretBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fullwidth_tilde_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fullwidth = CreateRequest("Same body.");
        fullwidth.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\uFF5Earchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fullwidth).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_tilde_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%7Earchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fullwidth_caret_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fullwidth = CreateRequest("Same body.");
        fullwidth.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\uFF3Earchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fullwidth).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_caret_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%5Earchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_tilde_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest tilde = CreateRequest("Same body.");
        tilde.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs~architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(tilde).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_caret_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest caret = CreateRequest("Same body.");
        caret.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs^architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(caret).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_dollar_sign_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest dollarBeforeDot = CreateRequest("Same body.");
        dollarBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs$architecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(dollarBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_asterisk_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest asteriskBeforeDot = CreateRequest("Same body.");
        asteriskBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs*architecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(asteriskBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_grave_accent_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest graveBeforeDot = CreateRequest("Same body.");
        graveBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs`architecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(graveBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_dollar_sign_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%24architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_asterisk_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%2Aarchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_grave_accent_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%60architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fullwidth_dollar_sign_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fullwidth = CreateRequest("Same body.");
        fullwidth.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\uFF04architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fullwidth).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fullwidth_asterisk_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fullwidth = CreateRequest("Same body.");
        fullwidth.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\uFF0Aarchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fullwidth).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fullwidth_grave_accent_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fullwidth = CreateRequest("Same body.");
        fullwidth.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\uFF40architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fullwidth).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_dollar_sign_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest dollar = CreateRequest("Same body.");
        dollar.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs$architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(dollar).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_asterisk_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest asterisk = CreateRequest("Same body.");
        asterisk.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs*architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(asterisk).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_grave_accent_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest grave = CreateRequest("Same body.");
        grave.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs`architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(grave).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_hash_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest hashBeforeDot = CreateRequest("Same body.");
        hashBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs#architecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(hashBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_question_mark_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest questionBeforeDot = CreateRequest("Same body.");
        questionBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs?architecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(questionBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_hash_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%23architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_question_mark_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%3Farchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_fullwidth_hash_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest fullwidth = CreateRequest("Same body.");
        fullwidth.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\uFF03architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(fullwidth).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_question_mark_between_segments_and_query_suffix()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest mixed = CreateRequest("Same body.");
        mixed.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs?architecture/overview.md?version=1",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(mixed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_hash_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest hash = CreateRequest("Same body.");
        hash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs#architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(hash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_question_mark_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest question = CreateRequest("Same body.");
        question.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs?architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(question).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_middle_dot_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest middleDotBeforeDot = CreateRequest("Same body.");
        middleDotBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u00B7architecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(middleDotBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_middle_dot_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%C2%B7architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_en_dash_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%E2%80%93architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_em_dash_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%E2%80%94architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_middle_dot_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest middleDot = CreateRequest("Same body.");
        middleDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u00B7architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(middleDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_en_dash_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest enDash = CreateRequest("Same body.");
        enDash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2013architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(enDash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_em_dash_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest emDash = CreateRequest("Same body.");
        emDash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2014architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(emDash).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_unicode_minus_sign_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest minusBeforeDot = CreateRequest("Same body.");
        minusBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2212architecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(minusBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_unicode_minus_sign_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%E2%88%92architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_unicode_hyphen_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%E2%80%90architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_unicode_minus_sign_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest minus = CreateRequest("Same body.");
        minus.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2212architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(minus).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_unicode_hyphen_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest hyphen = CreateRequest("Same body.");
        hyphen.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2010architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(hyphen).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_ascii_hyphen_kebab_segment_vs_slash()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest kebab = CreateRequest("Same body.");
        kebab.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs-architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(kebab).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_figure_dash_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest figureDashBeforeDot = CreateRequest("Same body.");
        figureDashBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2012architecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(figureDashBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_figure_dash_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%E2%80%92architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_horizontal_bar_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%E2%80%95architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_figure_dash_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest figureDash = CreateRequest("Same body.");
        figureDash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2012architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(figureDash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_horizontal_bar_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest horizontalBar = CreateRequest("Same body.");
        horizontalBar.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2015architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(horizontalBar).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_bullet_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest bulletBeforeDot = CreateRequest("Same body.");
        bulletBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2022architecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(bulletBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_bullet_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%E2%80%A2architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_black_circle_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest circle = CreateRequest("Same body.");
        circle.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u25CFarchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(circle).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_bullet_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest bullet = CreateRequest("Same body.");
        bullet.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2022architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(bullet).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_underscore_segment_vs_slash()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest underscore = CreateRequest("Same body.");
        underscore.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs_architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(underscore).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_black_small_square_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest squareBeforeDot = CreateRequest("Same body.");
        squareBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u25AAarchitecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(squareBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_black_small_square_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%E2%96%AAarchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_hyphen_bullet_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%E2%81%83architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_black_small_square_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest square = CreateRequest("Same body.");
        square.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u25AAarchitecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(square).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_hyphen_bullet_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest hyphenBullet = CreateRequest("Same body.");
        hyphenBullet.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2043architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(hyphenBullet).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_white_bullet_before_dotted_segment_name()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest whiteBulletBeforeDot = CreateRequest("Same body.");
        whiteBulletBeforeDot.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u25E6architecture.overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(whiteBulletBeforeDot).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_white_bullet_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%E2%97%A6architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_percent_encoded_triangular_bullet_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest encoded = CreateRequest("Same body.");
        encoded.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs%E2%80%A3architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(encoded).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_white_bullet_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest whiteBullet = CreateRequest("Same body.");
        whiteBullet.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u25E6architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(whiteBullet).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_file_name_differs_only_by_bullet_operator_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest bulletOperator = CreateRequest("Same body.");
        bulletOperator.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2219architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(bulletOperator).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_triangular_bullet_between_segments()
    {
        ClosedLoopReasoningRequest slash = CreateRequest("Same body.");
        slash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest triangular = CreateRequest("Same body.");
        triangular.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\u2023architecture/overview.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(slash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(triangular).ContentHash);
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
