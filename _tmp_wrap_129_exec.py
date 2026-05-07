path = r"c:\ArchLucid\ArchLucid\ArchLucid.Persistence\Migrations\129_RlsAuthorityChildTableScopeDenorm.sql"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

out = []
i = 0
while i < len(lines):
    line = lines[i]
    stripped = line.strip()
    if stripped == "BEGIN" and i + 1 < len(lines) and "Dynamic SQL" in lines[i + 1]:
        while i < len(lines):
            out.append(lines[i])
            i += 1
            if out[-1].strip() == "END;":
                break
        continue
    if stripped == "BEGIN" and i + 1 < len(lines) and lines[i + 1].startswith(
        "    ALTER SECURITY POLICY rls.ArchLucidTenantScope"
    ):
        out.append("BEGIN\n")
        i += 1
        chunk = []
        while i < len(lines):
            chunk.append(lines[i])
            ln = lines[i]
            i += 1
            if ln.rstrip().endswith(";") and ("BEFORE DELETE" in ln or "WITH (STATE" in ln):
                break
        inner_lines = []
        for cl in chunk:
            inner_lines.append(cl[4:].rstrip("\r\n") if cl.startswith("    ") else cl.rstrip("\r\n"))
        inner = "\n".join(inner_lines).strip()
        if not inner.endswith(";"):
            inner += ";"
        escaped = inner.replace("'", "''")
        out.append("    EXEC (N'" + escaped + "');\n")
        while i < len(lines) and lines[i].strip() != "END;":
            out.append(lines[i])
            i += 1
        if i < len(lines):
            out.append(lines[i])
            i += 1
        continue
    out.append(line)
    i += 1

with open(path, "w", encoding="utf-8", newline="\n") as f:
    f.writelines(out)
print("done")
