namespace ArchLucid.Application.Templates;

/// <summary>
///     Pre-built <see cref="ArchitectureRequest"/> payloads aligned with <c>POST /v1/architecture/request</c>.
///     HTTP catalog metadata for operator starters is sourced from embedded JSON via <see cref="TemplateProvider"/>.
///     Each legacy factory records <c>templateId</c> as the first inline document named <c>ArchLucid.TemplateId</c> (
///     <c>text/plain</c>) so callers can correlate evidence packs without extending the core request contract.
/// </summary>
public static partial class ArchitectureRequestTemplates;
