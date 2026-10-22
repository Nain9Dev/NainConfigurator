/**
 * Lazy pack loading.
 *
 * The configuration flow is interactive before a pack arrives and stays
 * interactive if one never does: a missing, unreachable or malformed pack
 * resolves to `"absent"` and the caller draws the accessible fallback view.
 */

import { useEffect, useState } from "react";

import { asset } from "../routes";
import { PackError, parsePack } from "./resolve";
import type { VisualPack } from "./types";

export type PackStatus = "idle" | "loading" | "ready" | "absent";

export interface PackState {
  status: PackStatus;
  pack: VisualPack | null;
}

const cache = new Map<string, Promise<VisualPack | null>>();

export function useVisualPack(key: string | null): PackState {
  const [state, setState] = useState<PackState>(() => ({
    status: key === null ? "absent" : "loading",
    pack: null,
  }));

  useEffect(() => {
    if (key === null) {
      setState({ status: "absent", pack: null });
      return;
    }

    let active = true;
    setState({ status: "loading", pack: null });

    void loadPack(key).then((pack) => {
      if (!active) {
        return;
      }

      setState(
        pack === null
          ? { status: "absent", pack: null }
          : { status: "ready", pack },
      );
    });

    return () => {
      active = false;
    };
  }, [key]);

  return state;
}

export function loadPack(key: string): Promise<VisualPack | null> {
  const cached = cache.get(key);

  if (cached !== undefined) {
    return cached;
  }

  const pending = fetchPack(key);
  cache.set(key, pending);

  return pending;
}

async function fetchPack(key: string): Promise<VisualPack | null> {
  // The key addresses a published asset. Anything that is not a plain
  // identifier is a packaging mistake, and refusing it here keeps a catalog
  // value from ever becoming part of a request path.
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(key)) {
    return null;
  }

  try {
    const response = await fetch(asset(`visual-packs/${key}.json`), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    return parsePack(await response.json());
  } catch (reason) {
    if (reason instanceof PackError && import.meta.env.DEV) {
      console.warn(`Visual pack "${key}" was rejected: ${reason.message}`);
    }

    return null;
  }
}

/** Test seam: drops memoised packs between cases. */
export function clearPackCache(): void {
  cache.clear();
}
