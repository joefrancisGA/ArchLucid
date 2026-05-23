import * as fs from "fs";
import * as path from "path";

const glossaryPath = path.resolve(process.cwd(), "../docs/library/GLOSSARY.md");
const outputPath = path.resolve(process.cwd(), "src/lib/glossary-terms.ts");

try {
  let content = "";
  if (fs.existsSync(glossaryPath)) {
    content = fs.readFileSync(glossaryPath, "utf-8");
  } else {
    // fallback if path differs
    const altPath = path.resolve(process.cwd(), "../docs/GLOSSARY.md");
    if (fs.existsSync(altPath)) {
      content = fs.readFileSync(altPath, "utf-8");
    } else {
      throw new Error("Could not find GLOSSARY.md");
    }
  }

  const lines = content.split("\n");
  let inTable = false;
  const terms: Record<string, string> = {};

  for (const line of lines) {
    if (line.trim().startsWith("| Term | Definition |")) {
      inTable = true;
      continue;
    }
    if (inTable && line.trim().startsWith("|------")) {
      continue;
    }
    if (inTable && line.trim().startsWith("|")) {
      const parts = line.split("|");
      if (parts.length >= 3) {
        let term = parts[1].trim();
        let definition = parts[2].trim();
        // remove ** from term
        term = term.replace(/\*\*/g, "");
        if (term && definition) {
          terms[term] = definition;
        }
      }
    } else if (inTable && !line.trim().startsWith("|") && line.trim() !== "") {
      break; // any non-table line ends it, except maybe we should just keep going?
    }
  }

  const fileContent = `// Auto-generated from GLOSSARY.md
export const glossaryTerms: Record<string, string> = ${JSON.stringify(terms, null, 2)};
`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, fileContent);
  console.log(`Generated ${outputPath} with ${Object.keys(terms).length} terms.`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
