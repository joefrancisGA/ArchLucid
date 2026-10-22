using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Compliance.Evaluators;

public interface IComplianceEvaluator
{
    ComplianceEvaluationResult Evaluate(
        GraphSnapshot graphSnapshot,
        ComplianceRulePack rulePack);
}
