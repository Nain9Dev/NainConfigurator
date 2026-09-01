import {
  countSelectedInGroup,
  describeGroupConstraint,
  formatMoney,
} from "../catalog";
import type { ProductCatalog } from "../types";

/**
 * Every control on this screen is generated from option groups and their
 * limits. A group with `maxSelections === 1` becomes radios, anything else
 * becomes checkboxes, and an optional single-choice group gains an explicit
 * "no selection" radio so it can be cleared with the keyboard.
 */
export function OptionGroups({
  catalog,
  selectedOptionCodes,
  onChange,
  disabled,
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
            className={isUnsatisfied ? "is-unsatisfied" : undefined}
            key={group.code}
          >
            <legend>
              <span>{group.name}</span>
              <small>{describeGroupConstraint(group)}</small>
            </legend>

            <div className="option-list">
              {isSingle && group.minSelections === 0 && (
                <label className="option-card">
                  <input
                    checked={selectedCount === 0}
                    disabled={disabled}
                    name={group.code}
                    onChange={() => onChange(groupCodes, null, true, true)}
                    type="radio"
                  />
                  <span className="option-body">
                    <strong>Sin selección</strong>
                    <small>Sin ajuste de precio</small>
                  </span>
                </label>
              )}

              {group.options.map((option) => {
                const isChecked = selectedOptionCodes.includes(option.code);

                return (
                  <label className="option-card" key={option.code}>
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
                    </span>
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
