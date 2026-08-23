import React from "react";

type FolderAwareFileInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** When true, enables folder selection via webkitdirectory (Chromium-based browsers). */
  readonly folderSelection?: boolean;
};

const folderSelectionAttributes = {
  webkitdirectory: "",
  directory: "",
} as React.InputHTMLAttributes<HTMLInputElement>;

/**
 * File input that optionally enables folder selection via webkitdirectory.
 * Centralizes non-standard DOM attributes so callers avoid @ts-expect-error suppressions.
 */
export const FolderAwareFileInput = React.forwardRef<HTMLInputElement, FolderAwareFileInputProps>(
  function FolderAwareFileInput({ folderSelection = false, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="file"
        {...(folderSelection ? folderSelectionAttributes : undefined)}
        {...props}
      />
    );
  },
);
