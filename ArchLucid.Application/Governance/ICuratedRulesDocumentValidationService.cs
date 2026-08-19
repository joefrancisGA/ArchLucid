using System.Text.Json.Nodes;

namespace ArchLucid.Application.Governance;

public interface ICuratedRulesDocumentValidationService
{
    CuratedRulesDocumentValidationResult Validate(JsonObject document);
}
