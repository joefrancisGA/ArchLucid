import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { X } from "lucide-react";
import { beforeAll, describe, expect, it } from "vitest";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

expect.extend(toHaveNoViolations);

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

describe("ui base components (button, dialog, alert-dialog) — axe (Vitest)", () => {
  it("Button with visible text has no axe violations", async () => {
    const { container } = render(<Button type="button">Submit</Button>);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("icon-sized Button with aria-label has no axe violations", async () => {
    const { container } = render(
      <Button type="button" size="icon" aria-label="Dismiss notification">
        <X className="h-4 w-4" aria-hidden />
      </Button>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("Dialog has no axe violations when open (portal scanned via baseElement)", async () => {
    const { baseElement } = render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm</DialogTitle>
            <DialogDescription>Optional description for assistive tech.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button">Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    expect(await axe(baseElement)).toHaveNoViolations();
  });

  it("AlertDialog has no axe violations when open", async () => {
    const { baseElement } = render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete row?</AlertDialogTitle>
            <AlertDialogDescription>This removes the row from the workspace catalog.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction type="button">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(await axe(baseElement)).toHaveNoViolations();
  });
});
