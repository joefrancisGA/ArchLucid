using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftAdmissionDomainHeuristicTests
{
    [Fact]
    public void Evaluate_Admits_ArchitectureIntent()
    {
        DraftRequestDocument document = BuildDocument(
            "Design a multi-tenant Azure API platform with private SQL.",
            "Reduce onboarding time.");

        DraftSemanticAdmissionEvaluation result = DraftAdmissionDomainHeuristic.Evaluate(document);

        result.Disposition.Should().Be(DraftSemanticAdmissionDispositionKind.Admitted);
    }

    [Fact]
    public void Evaluate_Redirects_NonArchitectureIntent()
    {
        DraftRequestDocument document = BuildDocument(
            "Write a chocolate cake recipe for the office potluck.",
            "Everyone enjoys dessert.");

        DraftSemanticAdmissionEvaluation result = DraftAdmissionDomainHeuristic.Evaluate(document);

        result.Disposition.Should().Be(DraftSemanticAdmissionDispositionKind.NonArchitecture);
        result.RedirectReason.Should().Contain("REJECT-AS-WRITTEN");
    }

    [Fact]
    public void Corpus_StructuralGateAndHeuristic_MatchExpectedDisposition()
    {
        string corpusPath = Path.Combine(
            RepoRoot.Resolve(),
            "tests",
            "eval-datasets",
            "draft-admission",
            "cases.json");
        string json = File.ReadAllText(corpusPath);
        DraftAdmissionCorpusFile? corpus = JsonSerializer.Deserialize<DraftAdmissionCorpusFile>(json, JsonRead);

        corpus.Should().NotBeNull();
        corpus!.Cases.Should().NotBeEmpty();

        DraftAdmissionGate structuralGate = new();

        foreach (DraftAdmissionCorpusCase testCase in corpus.Cases)
        {
            DraftRequestDocument document = BuildDocument(
                testCase.Intent,
                testCase.Outcome,
                testCase.ActorCount);

            DraftAdmissionEvaluation structural = structuralGate.Evaluate(document);
            DraftSemanticAdmissionEvaluation heuristic = DraftAdmissionDomainHeuristic.Evaluate(document);

            switch (testCase.ExpectedDisposition)
            {
                case "admitted":
                    structural.Admitted.Should().BeTrue($"case {testCase.Id} should pass structural gate");
                    heuristic.Disposition.Should().Be(DraftSemanticAdmissionDispositionKind.Admitted);
                    break;
                case "non_architecture":
                    heuristic.Disposition.Should().Be(DraftSemanticAdmissionDispositionKind.NonArchitecture);
                    break;
                case "redirect":
                    if (structural.Admitted)
                    {
                        heuristic.Disposition.Should().NotBe(DraftSemanticAdmissionDispositionKind.Admitted);
                    }
                    else
                    {
                        structural.Admitted.Should().BeFalse();
                    }

                    break;
                default:
                    throw new InvalidOperationException($"Unknown expected disposition '{testCase.ExpectedDisposition}'.");
            }
        }
    }

    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private static DraftRequestDocument BuildDocument(string intent, string outcome, int actorCount = 1)
    {
        List<ActorDescriptor> actors = [];

        for (int index = 0; index < actorCount; index++)
        {
            actors.Add(new ActorDescriptor
            {
                Kind = ActorKind.Human,
                TrustOrigin = TrustOrigin.Internal,
                Contract = InteractionContract.Sync,
                Origin = ActorOrigin.Asserted,
            });
        }

        return new DraftRequestDocument
        {
            FreeTextIntent = intent,
            BusinessOutcome = outcome,
            ActorSet = new ActorSet { Actors = actors },
        };
    }

    private sealed class DraftAdmissionCorpusFile
    {
        [JsonPropertyName("cases")]
        public List<DraftAdmissionCorpusCase> Cases
        {
            get;
            init;
        } = [];
    }

    private sealed class DraftAdmissionCorpusCase
    {
        [JsonPropertyName("id")]
        public string Id
        {
            get;
            init;
        } = string.Empty;

        [JsonPropertyName("intent")]
        public string Intent
        {
            get;
            init;
        } = string.Empty;

        [JsonPropertyName("outcome")]
        public string Outcome
        {
            get;
            init;
        } = string.Empty;

        [JsonPropertyName("actorCount")]
        public int ActorCount
        {
            get;
            init;
        }

        [JsonPropertyName("expectedDisposition")]
        public string ExpectedDisposition
        {
            get;
            init;
        } = string.Empty;
    }

    private static class RepoRoot
    {
        public static string Resolve()
        {
            DirectoryInfo? current = new(Directory.GetCurrentDirectory());

            while (current is not null)
            {
                if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
                {
                    return current.FullName;
                }

                current = current.Parent;
            }

            throw new InvalidOperationException("Could not locate repository root.");
        }
    }
}
