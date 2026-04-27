import xml.etree.ElementTree as ET
import sys

p = sys.argv[1] if len(sys.argv) > 1 else r"coverage-persistence-out/691da521-5251-41ca-81dd-f2df01413e21/coverage.cobertura.xml"
root = ET.parse(p).getroot()
by_file: dict[str, list[tuple[str, float, int, int]]] = {}
prefix = "ArchLucid.Persistence\\"
skip_prefixes = (
    "ArchLucid.Persistence.Advisory\\",
    "ArchLucid.Persistence.Alerts\\",
    "ArchLucid.Persistence.Coordination\\",
    "ArchLucid.Persistence.Integration\\",
    "ArchLucid.Persistence.Runtime\\",
)
for pkg in root.iter("package"):
    for cls in pkg.iter("class"):
        fn = cls.get("filename", "").replace("/", "\\")
        if not fn.startswith(prefix):
            continue
        if any(fn.startswith(s) for s in skip_prefixes):
            continue
        lr = float(cls.get("line-rate", "1"))
        lines = cls.findall("lines/line")
        n = len(lines)
        hit = sum(1 for line in lines if int(line.get("hits", 0)) > 0)
        by_file.setdefault(fn, []).append((cls.get("name", ""), lr, n, hit))

total_lines = 0
covered = 0
low: list[tuple[float, int, int, str, str]] = []
for fn, rows in by_file.items():
    for name, lr, n, hit in rows:
        total_lines += n
        covered += hit
        if lr < 0.63 and n >= 4:
            low.append((lr, n, hit, fn, name))

low.sort()
# Biggest uncovered impact: (1-lr)*n
impact: list[tuple[float, float, int, int, str, str]] = []
for fn, rows in by_file.items():
    for name, lr, n, hit in rows:
        if n < 3:
            continue
        impact.append(((1.0 - lr) * n, lr, n, hit, fn, name))
impact.sort(reverse=True)
pct = round(covered / total_lines * 100, 2) if total_lines else 0.0
print(f"ArchLucid.Persistence (main) line coverage: {pct}% ({covered}/{total_lines})")
print("Top uncovered mass (impact, line-rate, lines, file):")
for imp, lr, n, hit, fn, name in impact[:25]:
    short = fn.replace("ArchLucid.Persistence\\", "")
    print(f"  impact={imp:.0f}  lr={lr:.2f}  n={n}  {short} :: {name}")
print("Worst classes (line-rate, lines, hits, file):")
for lr, n, hit, fn, name in low[:40]:
    short = fn.replace("ArchLucid.Persistence\\", "")
    print(f"  {lr:.2f}  n={n} hit={hit}  {short} :: {name}")
