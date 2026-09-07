"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { ProductLineAssignment } from "@/lib/product-line/product-line-assignment";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import {
  clearProductLineAssignmentOverrides,
  persistProductLineAssignmentOverrides,
  persistProductLineCookie,
  readProductLineAssignmentOverrides,
} from "@/lib/product-line/product-line-storage";
import { resolveProductLineId, resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

export type ProductLineContextValue = {
  readonly productLine: ProductLineId;
  readonly assignmentOverrides: Readonly<Record<string, ProductLineAssignment>>;
  readonly setProductLine: (productLine: ProductLineId) => void;
  readonly setHrefAssignment: (href: string, assignment: ProductLineAssignment) => void;
  readonly resetHrefAssignment: (href: string) => void;
  readonly resetAllAssignments: () => void;
};

const ProductLineContext = createContext<ProductLineContextValue | null>(null);

export function ProductLineProvider(props: { readonly children: ReactNode }): React.JSX.Element {
  const [productLine, setProductLineState] = useState<ProductLineId>(resolveProductLineIdFromEnv);
  const [assignmentOverrides, setAssignmentOverrides] = useState<Readonly<Record<string, ProductLineAssignment>>>(
    {},
  );

  useEffect(() => {
    setProductLineState(resolveProductLineId());
    setAssignmentOverrides(readProductLineAssignmentOverrides());
  }, []);

  const value = useMemo<ProductLineContextValue>(() => {
    return {
      productLine,
      assignmentOverrides,
      setProductLine: (next) => {
        persistProductLineCookie(next === resolveProductLineIdFromEnv() ? null : next);
        setProductLineState(next);
      },
      setHrefAssignment: (href, assignment) => {
        setAssignmentOverrides((current) => {
          const next = { ...current, [href]: assignment };
          persistProductLineAssignmentOverrides(next);

          return next;
        });
      },
      resetHrefAssignment: (href) => {
        setAssignmentOverrides((current) => {
          const next = { ...current };
          delete next[href];
          persistProductLineAssignmentOverrides(next);

          return next;
        });
      },
      resetAllAssignments: () => {
        clearProductLineAssignmentOverrides();
        setAssignmentOverrides({});
      },
    };
  }, [assignmentOverrides, productLine]);

  return <ProductLineContext.Provider value={value}>{props.children}</ProductLineContext.Provider>;
}

export function useProductLine(): ProductLineContextValue {
  const value = useContext(ProductLineContext);

  if (value === null) {
    return {
      productLine: resolveProductLineIdFromEnv(),
      assignmentOverrides: {},
      setProductLine: () => {},
      setHrefAssignment: () => {},
      resetHrefAssignment: () => {},
      resetAllAssignments: () => {},
    };
  }

  return value;
}
