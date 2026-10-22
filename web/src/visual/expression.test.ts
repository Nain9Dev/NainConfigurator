import { describe, expect, it } from "vitest";

import { evaluateExpression, ExpressionError } from "./expression";

const vars = { W: 160, D: 80, H: 74, T: 3.6 };

describe("evaluateExpression", () => {
  it("returns a numeric literal unchanged", () => {
    expect(evaluateExpression(42, vars)).toBe(42);
  });

  it("resolves a bare variable", () => {
    expect(evaluateExpression("W", vars)).toBe(160);
  });

  it("applies multiplication before addition", () => {
    expect(evaluateExpression("2 + 3 * 4", vars)).toBe(14);
  });

  it("honours parentheses", () => {
    expect(evaluateExpression("(2 + 3) * 4", vars)).toBe(20);
  });

  it("supports unary minus over a parenthesised group", () => {
    expect(evaluateExpression("-(W/2 - 7)", vars)).toBe(-73);
  });

  it("binds unary minus tighter than division", () => {
    expect(evaluateExpression("-D/2 + 16", vars)).toBe(-24);
  });

  it("mixes variables and literals", () => {
    expect(evaluateExpression("H - T/2", vars)).toBeCloseTo(72.2, 10);
  });

  it("accepts decimal literals", () => {
    expect(evaluateExpression("0.5 * 3", vars)).toBe(1.5);
  });

  it("rejects an unknown variable", () => {
    expect(() => evaluateExpression("X + 1", vars)).toThrow(ExpressionError);
  });

  it("does not resolve inherited object members", () => {
    expect(() => evaluateExpression("toString", vars)).toThrow(
      /Unknown variable/u,
    );
    expect(() => evaluateExpression("constructor", vars)).toThrow(
      /Unknown variable/u,
    );
  });

  it("rejects call syntax", () => {
    expect(() => evaluateExpression("W(1)", vars)).toThrow(ExpressionError);
  });

  it("rejects trailing characters", () => {
    expect(() => evaluateExpression("W 1", vars)).toThrow(ExpressionError);
  });

  it("rejects an unclosed group", () => {
    expect(() => evaluateExpression("(W + 1", vars)).toThrow(/Unclosed/u);
  });

  it("rejects division by zero rather than returning Infinity", () => {
    expect(() => evaluateExpression("W / 0", vars)).toThrow(
      /Division by zero/u,
    );
  });

  it("rejects an empty expression", () => {
    expect(() => evaluateExpression("", vars)).toThrow(ExpressionError);
  });

  it("rejects a non-finite literal", () => {
    expect(() => evaluateExpression(Number.NaN, vars)).toThrow(ExpressionError);
  });

  it("rejects a non-numeric variable value", () => {
    const polluted = { W: "160" } as unknown as Record<string, number>;

    expect(() => evaluateExpression("W", polluted)).toThrow(ExpressionError);
  });
});
