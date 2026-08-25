import { formatPolicySection, pushPolicyAtCommitMarkdownLines } from "./export-markdown-policy-section";
import { isRecord, normalizeInlineText, pushBulletLines } from "./export-markdown-text";

function formatRequirementItems(items: unknown, heading: string, lines: string[]): void {
  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  lines.push(`### ${heading}`);
  lines.push("");

  for (const raw of items) {
    if (!isRecord(raw)) {
      continue;
    }

    const name = normalizeInlineText(raw.requirementName);
    const text = normalizeInlineText(raw.requirementText);
    const status = normalizeInlineText(raw.coverageStatus);

    if (name) {
      lines.push(`- **${name}**`);
    }

    if (status) {
      lines.push(`  - Coverage: ${status}`);
    }

    if (text) {
      lines.push(`  - ${text}`);
    }
  }

  lines.push("");
}

export function formatManifestDocumentShape(m: Record<string, unknown>): string {
  const lines: string[] = [];
  const meta = isRecord(m.metadata) ? m.metadata : null;
  const topology = isRecord(m.topology) ? m.topology : null;
  const security = isRecord(m.security) ? m.security : null;
  const requirements = isRecord(m.requirements) ? m.requirements : null;
  const constraints = isRecord(m.constraints) ? m.constraints : null;
  const cost = isRecord(m.cost) ? m.cost : null;
  const compliance = isRecord(m.compliance) ? m.compliance : null;
  const policy = isRecord(m.policy) ? m.policy : null;

  const manifestId = normalizeInlineText(m.manifestId);
  const runId = normalizeInlineText(m.runId);
  const ruleSetId = normalizeInlineText(m.ruleSetId);
  const ruleSetVersion = normalizeInlineText(m.ruleSetVersion);
  const manifestHash = normalizeInlineText(m.manifestHash);
  const changeDescription = meta ? normalizeInlineText(meta.changeDescription) : null;
  const manifestVersion = meta ? normalizeInlineText(meta.manifestVersion) : null;

  const titleBase = changeDescription ?? manifestVersion ?? "Architecture review record";

  lines.push(`# ${titleBase}`);
  lines.push("");

  lines.push("## Document metadata");
  lines.push("");

  if (manifestId) {
    lines.push(`- **Review record id:** \`${manifestId}\``);
  }

  if (runId) {
    lines.push(`- **Review id:** \`${runId}\``);
  }

  if (ruleSetId && ruleSetVersion) {
    lines.push(`- **Policy pack:** ${ruleSetId} @ ${ruleSetVersion}`);
  } else if (ruleSetId) {
    lines.push(`- **Policy pack:** ${ruleSetId}`);
  }

  if (manifestHash) {
    lines.push(`- **Review record hash:** \`${manifestHash}\``);
  }

  if (manifestVersion) {
    lines.push(`- **Review record version:** ${manifestVersion}`);
  }

  pushPolicyAtCommitMarkdownLines(m, lines);

  lines.push("## Objectives");
  lines.push("");

  if (changeDescription) {
    lines.push(changeDescription);
    lines.push("");
  }

  if (requirements !== null) {
    formatRequirementItems(requirements.covered, "Covered requirements", lines);
    formatRequirementItems(requirements.uncovered, "Uncovered requirements", lines);
  }

  formatPolicySection(policy, lines);

  if (
    !changeDescription &&
    requirements === null &&
    policy === null
  ) {
    lines.push("_No explicit objectives were present on the review record document._");
    lines.push("");
  }

  lines.push("## Architecture overview");
  lines.push("");

  pushBulletLines(lines, m.assumptions, "_No assumptions listed._");

  lines.push("");

  if (constraints !== null) {
    lines.push("### Constraints");
    lines.push("");
    pushBulletLines(lines, constraints.mandatoryConstraints, "_No mandatory constraints._");
    pushBulletLines(lines, constraints.preferences, undefined);
    lines.push("");
  }

  if (topology !== null) {
    lines.push("### Architecture structure");
    lines.push("");
    pushBulletLines(lines, topology.selectedPatterns, undefined);
    pushBulletLines(lines, topology.resources, undefined);
    pushBulletLines(lines, topology.gaps, undefined);
    lines.push("");
  }

  if (cost !== null) {
    lines.push("### Cost");
    lines.push("");
    pushBulletLines(lines, cost.notes, undefined);
    pushBulletLines(lines, cost.costRisks, undefined);

    if (typeof cost.maxMonthlyCost === "number") {
      lines.push(`- **Max monthly cost (estimate):** ${cost.maxMonthlyCost}`);
    }

    lines.push("");
  }

  if (compliance !== null) {
    lines.push("### Compliance");
    lines.push("");
    const controls = compliance.controls;

    if (Array.isArray(controls)) {
      for (const c of controls) {
        if (!isRecord(c)) {
          continue;
        }

        const name = normalizeInlineText(c.controlName);
        const status = normalizeInlineText(c.status);

        if (name && status) {
          lines.push(`- **${name}:** ${status}`);
        } else if (name) {
          lines.push(`- ${name}`);
        }
      }
    }

    pushBulletLines(lines, compliance.gaps, undefined);
    lines.push("");
  }

  lines.push("## Component breakdown");
  lines.push("");

  const decisions = Array.isArray(m.decisions) ? m.decisions : [];
  const services = topology !== null && Array.isArray(topology.services) ? topology.services : [];
  const datastores =
    topology !== null && Array.isArray(topology.datastores) ? topology.datastores : [];
  const relationships =
    topology !== null && Array.isArray(topology.relationships) ? topology.relationships : [];

  if (services.length > 0) {
    lines.push("### Services");
    lines.push("");

    for (const s of services) {
      if (!isRecord(s)) {
        continue;
      }

      const name = normalizeInlineText(s.serviceName);
      const sid = normalizeInlineText(s.serviceId);
      const purpose = normalizeInlineText(s.purpose);

      if (name) {
        lines.push(`- **${name}**${sid ? ` (\`${sid}\`)` : ""}`);
      }

      if (purpose) {
        lines.push(`  - ${purpose}`);
      }
    }

    lines.push("");
  }

  if (datastores.length > 0) {
    lines.push("### Datastores");
    lines.push("");

    for (const ds of datastores) {
      if (!isRecord(ds)) {
        continue;
      }

      const name = normalizeInlineText(ds.name);
      const did = normalizeInlineText(ds.datastoreId);

      if (name) {
        lines.push(`- **${name}**${did ? ` (\`${did}\`)` : ""}`);
      }
    }

    lines.push("");
  }

  if (relationships.length > 0) {
    lines.push("### Relationships");
    lines.push("");

    for (const r of relationships) {
      if (!isRecord(r)) {
        continue;
      }

      const desc = normalizeInlineText(r.description);
      const relId = normalizeInlineText(r.relationshipId);
      const src = normalizeInlineText(r.sourceId);
      const tgt = normalizeInlineText(r.targetId);
      const parts = [src, tgt].filter(Boolean).join(" → ");

      if (desc) {
        lines.push(`- ${desc}${relId ? ` (\`${relId}\`)` : ""}`);
      } else if (parts) {
        lines.push(`- ${parts}${relId ? ` (\`${relId}\`)` : ""}`);
      }
    }

    lines.push("");
  }

  if (decisions.length > 0) {
    lines.push("### Architecture decisions");
    lines.push("");

    for (const d of decisions) {
      if (!isRecord(d)) {
        continue;
      }

      const dTitle = normalizeInlineText(d.title);
      const did = normalizeInlineText(d.decisionId);
      const category = normalizeInlineText(d.category);
      const rationale = normalizeInlineText(d.rationale);
      const option = normalizeInlineText(d.selectedOption);

      if (dTitle) {
        lines.push(`#### ${dTitle}`);
        lines.push("");
      }

      if (did) {
        lines.push(`- **Decision id:** \`${did}\``);
      }

      if (category) {
        lines.push(`- **Category:** ${category}`);
      }

      if (option) {
        lines.push(`- **Selected option:** ${option}`);
      }

      if (rationale) {
        lines.push("");
        lines.push(rationale);
      }

      lines.push("");
    }
  }

  if (
    services.length === 0 &&
    datastores.length === 0 &&
    relationships.length === 0 &&
    decisions.length === 0
  ) {
    lines.push("_No services, datastores, relationships, or decisions were present._");
    lines.push("");
  }

  lines.push("## Security model");
  lines.push("");

  if (security !== null) {
    const controls = Array.isArray(security.controls) ? security.controls : [];

    if (controls.length > 0) {
      lines.push("### Controls");
      lines.push("");

      for (const c of controls) {
        if (!isRecord(c)) {
          continue;
        }

        const cname = normalizeInlineText(c.controlName);
        const status = normalizeInlineText(c.status);
        const impact = normalizeInlineText(c.impact);

        if (cname) {
          lines.push(`- **${cname}**${status ? ` — ${status}` : ""}${impact ? ` (${impact})` : ""}`);
        }
      }

      lines.push("");
    }

    pushBulletLines(lines, security.gaps, undefined);
  }

  pushBulletLines(lines, m.warnings, undefined);

  return lines.join("\n").trimEnd() + "\n";
}
