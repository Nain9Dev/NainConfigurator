import { type CSSProperties } from "react";

import {
  countSelectedInGroup,
  describeGroupConstraint,
  formatMoney,
  ruleRoleFor,
} from "../catalog";
import type { CompatibilityRule, ProductCatalog } from "../types";
import { swatchColorsFor } from "../visual/swatches";
import type { VisualPack } from "../visual/types";

/**
 * Every control on this screen is generated from option groups and their
 * limits. A group with `maxSelections === 1` becomes radios, anything else
 * becomes checkboxes, and an optional single-choice group gains an explicit
 * "none" radio so it can be cleared with the keyboard.
 *
 * Each option is a tile around a native input. When the product's visual pack
 * binds the option's key to a material slot, the tile shows that material's
 * colour, so a finish reads as a colour before it reads as a word.
 *
 * Broken compatibility rules are marked on the options themselves — on the one
 * that triggers the rule and on the ones that would satisfy it — so the fix is
 * where the problem is rather than in a notice further down the page.
 */
export function OptionGroups({
  catalog,
  selectedOptionCodes,
  onChange,
  disabled,
  brokenRules,
  pack = null,
}: {
  catalog: ProductCatalog;
  selectedOptionCodes: string[];
  onChange: (
    groupOptionCodes: string[],
    optionCode: string | null,
    singleSelection: boolean,
    checked: boolean,
  ) => void;
  disabled: boolean;
  brokenRules: readonly CompatibilityRule[];
  pack?: VisualPack | null;
}) {
  return (
    <section className="control-panel" aria-label="Opciones">
      {catalog.product.optionGroups.map((group) => {
        const isSingle = group.maxSelections === 1;
        const groupCodes = group.options.map((option) => option.code);
        const selectedCount = countSelectedInGroup(group, selectedOptionCodes);
        const isUnsatisfied = selectedCount < group.minSelections;

        return (
          <fieldset
            className={`option-group${isUnsatisfied ? " is-unsatisfied" : ""}`}
            key={group.code}
          >
            <legend>
              <span>{group.name}</span>
              <small>{describeGroupConstraint(group)}</small>
            </legend>

            <div className="option-list">
              {isSingle && group.minSelections === 0 && (
                <label className="option-tile is-none">
                  <input
                    checked={selectedCount === 0}
                    disabled={disabled}
                    name={group.code}
                    onChange={() => onChange(groupCodes, null, true, true)}
                    type="radio"
                  />
                  <span className="option-body">
                    <strong>Ninguna</strong>
                    <small>Incluido</small>
                  </span>
                  <span aria-hidden="true" className="option-check" />
                </label>
              )}

              {group.options.map((option) => {
                const isChecked = selectedOptionCodes.includes(option.code);
                const role = ruleRoleFor(brokenRules, option.code, isChecked);
                const swatches = swatchColorsFor(pack, option.visualAssetKey);
                const classes = ["option-tile"];

                if (role !== null) {
                  classes.push(`is-${role}`);
                }
                if (swatches.length > 0) {
                  classes.push("has-swatch");
                }

                return (
                  <label className={classes.join(" ")} key={option.code}>
                    <input
                      checked={isChecked}
                      disabled={disabled}
                      name={isSingle ? group.code : undefined}
                      onChange={(event) =>
                        onChange(
                          groupCodes,
                          option.code,
                          isSingle,
                          event.currentTarget.checked,
                        )
                      }
                      type={isSingle ? "radio" : "checkbox"}
                    />
                    {swatches.length > 0 && (
                      <span
                        aria-hidden="true"
                        className="option-swatch"
                        style={swatchStyle(swatches)}
                      />
                    )}
                    <span className="option-body">
                      <strong>{option.name}</strong>
                      <small>
                        {option.priceAdjustment === 0
                          ? "Incluido"
                          : `+ ${formatMoney(
                              option.priceAdjustment,
                              catalog.company.locale,
                              catalog.product.currencyCode,
                            )}`}
                      </small>
                      {role !== null && (
                        <small className="option-flag">
                          {role === "conflict"
                            ? "Incompatible con la selección actual"
                            : "Resuelve la incompatibilidad"}
                        </small>
                      )}
                    </span>
                    <span aria-hidden="true" className="option-check" />
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </section>
  );
}

/** One colour fills the swatch; several split it into equal diagonal bands. */
function swatchStyle(colors: string[]): CSSProperties {
  if (colors.length === 1) {
    return { background: colors[0] };
  }

  const share = 100 / colors.length;
  const bands = colors
    .map(
      (color, index) =>
        `${color} ${(index * share).toFixed(1)}% ${((index + 1) * share).toFixed(1)}%`,
    )
    .join(", ");

  return { background: `linear-gradient(135deg, ${bands})` };
}
