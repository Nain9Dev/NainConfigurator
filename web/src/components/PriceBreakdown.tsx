import { formatMoney, formatSignedMoney } from "../catalog";
import type { PriceComponent } from "../types";

/**
 * The authoritative price, itemised.
 *
 * The API already returns a component-by-component breakdown; showing it is
 * what turns "trust me, it is 504,40 €" into something a commercial owner can
 * check line by line.
 */
export function PriceBreakdown({
  components,
  total,
  locale,
  currencyCode,
  caption,
}: {
  components: PriceComponent[];
  total: number;
  locale: string;
  currencyCode: string;
  caption: string;
}) {
  return (
    <table className="price-breakdown">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Concepto</th>
          <th scope="col">Importe</th>
        </tr>
      </thead>
      <tbody>
        {components.map((component, index) => (
          <tr key={`${component.type}-${component.code}-${index}`}>
            <th scope="row">
              <span>{component.name}</span>
              <code>{component.code}</code>
            </th>
            <td>
              {component.type === "BasePrice"
                ? formatMoney(component.amount, locale, currencyCode)
                : formatSignedMoney(component.amount, locale, currencyCode)}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Total estimado</th>
          <td>{formatMoney(total, locale, currencyCode)}</td>
        </tr>
      </tfoot>
    </table>
  );
}
