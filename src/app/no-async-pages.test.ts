import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// Pages and layouts must stay synchronous: data fetching belongs in child
// components wrapped in <Suspense>, so the route shell can render instantly.
// Routes are discovered from the filesystem, so new routes are covered
// automatically.

const APP_DIR = path.resolve(__dirname);
const ROUTE_FILE = /^(page|layout)\.(tsx|ts|jsx|js)$/;

function findRouteFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((rel) => ROUTE_FILE.test(path.basename(rel)))
    .map((rel) => path.join(dir, rel))
    .sort();
}

function hasAsyncModifier(node: ts.Node): boolean {
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some(
      (m) => m.kind === ts.SyntaxKind.AsyncKeyword,
    )
  );
}

function isDefaultExport(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  const kinds = (ts.getModifiers(node) ?? []).map((m) => m.kind);
  return (
    kinds.includes(ts.SyntaxKind.ExportKeyword) &&
    kinds.includes(ts.SyntaxKind.DefaultKeyword)
  );
}

/** Unwraps parentheses, `as`, `satisfies` and wrappers like memo(fn). */
function unwrap(expr: ts.Expression): ts.Expression {
  let e = expr;
  for (;;) {
    if (
      ts.isParenthesizedExpression(e) ||
      ts.isAsExpression(e) ||
      ts.isSatisfiesExpression(e)
    ) {
      e = e.expression;
    } else if (ts.isCallExpression(e) && e.arguments.length > 0) {
      e = e.arguments[0];
    } else {
      return e;
    }
  }
}

/** Finds the function/arrow declared under `name` at the top level. */
function resolveIdentifier(
  sf: ts.SourceFile,
  name: string,
): ts.Node | undefined {
  for (const stmt of sf.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name?.text === name) return stmt;
    if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (
          ts.isIdentifier(decl.name) &&
          decl.name.text === name &&
          decl.initializer
        ) {
          return unwrap(decl.initializer);
        }
      }
    }
  }
  return undefined;
}

type Result = { found: false } | { found: true; isAsync: boolean };

/** Reports whether a module's default export is an async function. */
function checkDefaultExport(source: string, fileName = "x.tsx"): Result {
  const sf = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  for (const stmt of sf.statements) {
    // export default function Page() {} / export default async function Page() {}
    if (ts.isFunctionDeclaration(stmt) && isDefaultExport(stmt)) {
      return { found: true, isAsync: hasAsyncModifier(stmt) };
    }

    // export default <expression>
    if (ts.isExportAssignment(stmt) && !stmt.isExportEquals) {
      let target: ts.Node | undefined = unwrap(stmt.expression);
      if (ts.isIdentifier(target)) {
        target = resolveIdentifier(sf, target.text) ?? target;
      }
      return { found: true, isAsync: hasAsyncModifier(target) };
    }

    // function Page() {}  export { Page as default }
    if (
      ts.isExportDeclaration(stmt) &&
      !stmt.moduleSpecifier &&
      stmt.exportClause &&
      ts.isNamedExports(stmt.exportClause)
    ) {
      for (const el of stmt.exportClause.elements) {
        if (el.name.text === "default") {
          const local = (el.propertyName ?? el.name).text;
          const target = resolveIdentifier(sf, local);
          return { found: true, isAsync: !!target && hasAsyncModifier(target) };
        }
      }
    }
  }

  return { found: false };
}

describe("checkDefaultExport (detector self-test)", () => {
  const cases: [string, string, boolean][] = [
    ["sync function", "export default function P() {}", false],
    ["async function", "export default async function P() {}", true],
    ["async anonymous", "export default async function () {}", true],
    ["sync arrow", "export default () => null;", false],
    ["async arrow", "export default async () => null;", true],
    [
      "async const via identifier",
      "const P = async () => null;\nexport default P;",
      true,
    ],
    [
      "async declaration via identifier",
      "async function P() {}\nexport default P;",
      true,
    ],
    [
      "async via export clause",
      "async function P() {}\nexport { P as default };",
      true,
    ],
    ["async wrapped in memo", "export default memo(async () => null);", true],
    ["async with cast", "export default (async () => null) as any;", true],
  ];

  it.each(cases)("%s", (_name, source, expectedAsync) => {
    expect(checkDefaultExport(source)).toEqual({
      found: true,
      isAsync: expectedAsync,
    });
  });

  it("reports a missing default export", () => {
    expect(checkDefaultExport("export const x = 1;")).toEqual({ found: false });
  });
});

describe("app routes", () => {
  const files = findRouteFiles(APP_DIR);

  it("discovers route files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(
    files.map((f) => [path.relative(process.cwd(), f), f] as const),
  )("%s has a non-async default export", (_rel, file) => {
    const result = checkDefaultExport(readFileSync(file, "utf8"), file);
    expect(result.found, "no default export found").toBe(true);
    expect(
      result.found && result.isAsync,
      "default export is async; move data fetching into a child component wrapped in <Suspense>",
    ).toBe(false);
  });
});
