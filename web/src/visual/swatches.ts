/**
 * Colour swatches for option controls, derived from pack data alone.
 *
 * An option whose visual asset key overrides a material slot in the product's
 * pack is, to the viewer, a colour choice. Reading that colour back out of the
 * pack lets the control show it before the user has to read the option name.
 * Nothing here knows what the slot, the material or the key stand for.
 */

import type { VisualPack } from "./types";

/**
 * The colours every slot override bound to `key` resolves to, in slot
 * declaration order. Empty when the key binds nothing, the material is not
 * declared, or there is no pack.
 */
export function swatchColorsFor(
  pack: VisualPack | null,
  key: string | null,
): string[] {
  if (pack === null || key === null) {
    return [];
  }

  const colors: string[] = [];

  for (const definition of Object.values(pack.slots)) {
    const override = definition.when?.find((entry) => entry.key === key);
    const material =
      override === undefined ? undefined : pack.materials[override.material];

    if (material !== undefined) {
      colors.push(material.color);
    }
  }

  return colors;
}
