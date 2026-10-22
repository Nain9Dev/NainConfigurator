/**
 * Arithmetic over a pack's resolved variables.
 *
 * Packs are data loaded at runtime, so this deliberately is not `eval`, `Function`
 * or anything that can reach a global. The grammar is closed:
 *
 *   expr   := term (("+" | "-") term)*
 *   term   := unary (("*" | "/") unary)*
 *   unary  := ("-" | "+")? primary
 *   primary := number | identifier | "(" expr ")"
 *
 * An identifier resolves against the variable map and nothing else. There is no
 * call syntax, no property access and no way to name a value the pack did not
 * declare.
 */

export class ExpressionError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ExpressionError";
  }
}

export function evaluateExpression(
  source: number | string,
  variables: Readonly<Record<string, number>>,
): number {
  if (typeof source === "number") {
    if (!Number.isFinite(source)) {
      throw new ExpressionError(`Non-finite literal: ${source}`);
    }

    return source;
  }

  const parser = new Parser(source, variables);
  const value = parser.parseExpression();
  parser.expectEnd();

  if (!Number.isFinite(value)) {
    throw new ExpressionError(`Expression is not finite: ${source}`);
  }

  return value;
}

const IDENTIFIER_START = /[A-Za-z_]/;
const IDENTIFIER_PART = /[A-Za-z0-9_]/;
const DIGIT = /[0-9]/;

class Parser {
  private index = 0;

  public constructor(
    private readonly source: string,
    private readonly variables: Readonly<Record<string, number>>,
  ) {}

  public parseExpression(): number {
    let value = this.parseTerm();

    for (;;) {
      const operator = this.peekOperator("+-");

      if (operator === null) {
        return value;
      }

      this.index += 1;
      const right = this.parseTerm();
      value = operator === "+" ? value + right : value - right;
    }
  }

  public expectEnd(): void {
    this.skipSpace();

    if (this.index < this.source.length) {
      throw new ExpressionError(
        `Unexpected "${this.source[this.index]}" in "${this.source}".`,
      );
    }
  }

  private parseTerm(): number {
    let value = this.parseUnary();

    for (;;) {
      const operator = this.peekOperator("*/");

      if (operator === null) {
        return value;
      }

      this.index += 1;
      const right = this.parseUnary();

      if (operator === "/" && right === 0) {
        throw new ExpressionError(`Division by zero in "${this.source}".`);
      }

      value = operator === "*" ? value * right : value / right;
    }
  }

  private parseUnary(): number {
    this.skipSpace();
    const character = this.source[this.index];

    if (character === "-") {
      this.index += 1;
      return -this.parseUnary();
    }

    if (character === "+") {
      this.index += 1;
      return this.parseUnary();
    }

    return this.parsePrimary();
  }

  private parsePrimary(): number {
    this.skipSpace();
    const character = this.source[this.index];

    if (character === undefined) {
      throw new ExpressionError(`Expression ends early: "${this.source}".`);
    }

    if (character === "(") {
      this.index += 1;
      const value = this.parseExpression();
      this.skipSpace();

      if (this.source[this.index] !== ")") {
        throw new ExpressionError(`Unclosed "(" in "${this.source}".`);
      }

      this.index += 1;
      return value;
    }

    if (DIGIT.test(character) || character === ".") {
      return this.parseNumber();
    }

    if (IDENTIFIER_START.test(character)) {
      return this.parseIdentifier();
    }

    throw new ExpressionError(`Unexpected "${character}" in "${this.source}".`);
  }

  private parseNumber(): number {
    const start = this.index;

    while (this.index < this.source.length) {
      const character = this.source[this.index] ?? "";

      if (!DIGIT.test(character) && character !== ".") {
        break;
      }

      this.index += 1;
    }

    const text = this.source.slice(start, this.index);
    const value = Number(text);

    if (Number.isNaN(value)) {
      throw new ExpressionError(`"${text}" is not a number.`);
    }

    return value;
  }

  private parseIdentifier(): number {
    const start = this.index;

    while (this.index < this.source.length) {
      const character = this.source[this.index] ?? "";

      if (!IDENTIFIER_PART.test(character)) {
        break;
      }

      this.index += 1;
    }

    const name = this.source.slice(start, this.index);

    // `Object.hasOwn` keeps a variable named "toString" from resolving to a
    // prototype member.
    if (!Object.hasOwn(this.variables, name)) {
      throw new ExpressionError(`Unknown variable "${name}".`);
    }

    const value = this.variables[name];

    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new ExpressionError(`Variable "${name}" is not a finite number.`);
    }

    return value;
  }

  private peekOperator(operators: string): string | null {
    this.skipSpace();
    const character = this.source[this.index];

    return character !== undefined && operators.includes(character)
      ? character
      : null;
  }

  private skipSpace(): void {
    while (this.index < this.source.length) {
      const character = this.source[this.index] ?? "";

      if (character !== " " && character !== "\t") {
        break;
      }

      this.index += 1;
    }
  }
}
