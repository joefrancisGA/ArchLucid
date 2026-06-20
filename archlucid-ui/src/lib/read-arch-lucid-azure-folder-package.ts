import { zipSync } from "fflate";

import {
  readArchLucidAzurePackageZipFromBytes,
  type ReadArchLucidAzurePackageZipResult,
} from "@/lib/read-arch-lucid-azure-package-zip";

export type FolderPackageFileStatus = {
  readonly name: string;
  readonly status: "pending" | "included" | "skipped" | "failed";
  readonly message?: string;
};

export type BuildFolderZipResult =
  | { ok: true; zipFile: File; fileStatuses: FolderPackageFileStatus[] }
  | { ok: false; message: string; fileStatuses: FolderPackageFileStatus[] };

function normalizeRelativePath(relativePath: string): string {
  return relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

/**
 * Packages a browser-selected folder (via webkitdirectory) into a ZIP for extractor upload.
 * Requires manifest.json somewhere in the tree.
 */
export async function buildArchLucidAzurePackageZipFromFileList(
  files: FileList | readonly File[],
): Promise<BuildFolderZipResult> {
  const fileArray = Array.from(files);
  const fileStatuses: FolderPackageFileStatus[] = [];
  const zipEntries: Record<string, Uint8Array> = {};
  let manifestFound = false;

  for (const file of fileArray) {
    const relativePath = normalizeRelativePath(
      (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
    );

    if (relativePath.length === 0) {
      fileStatuses.push({ name: file.name, status: "skipped", message: "Empty path" });
      continue;
    }

    const baseName = relativePath.split("/").pop()?.toLowerCase() ?? "";

    if (baseName === "manifest.json") {
      manifestFound = true;
    }

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      zipEntries[relativePath] = bytes;
      fileStatuses.push({ name: relativePath, status: "included" });
    } catch {
      fileStatuses.push({ name: relativePath, status: "failed", message: "Could not read file" });
    }
  }

  if (!manifestFound) {
    return {
      ok: false,
      message: "No manifest.json found in the selected folder — run Get-ArchLucidAzurePackage.ps1 first.",
      fileStatuses,
    };
  }

  let zipBytes: Uint8Array;

  try {
    zipBytes = zipSync(zipEntries);
  } catch {
    return {
      ok: false,
      message: "Could not package the folder into a ZIP archive.",
      fileStatuses,
    };
  }

  const zipFile = new File([Uint8Array.from(zipBytes)], "azure-package-folder.zip", { type: "application/zip" });

  return { ok: true, zipFile, fileStatuses };
}

export async function readArchLucidAzurePackageFromFileList(
  files: FileList | readonly File[],
): Promise<ReadArchLucidAzurePackageZipResult> {
  const built = await buildArchLucidAzurePackageZipFromFileList(files);

  if (!built.ok) {
    return { ok: false, message: built.message };
  }

  const bytes = new Uint8Array(await built.zipFile.arrayBuffer());

  return readArchLucidAzurePackageZipFromBytes(bytes);
}
