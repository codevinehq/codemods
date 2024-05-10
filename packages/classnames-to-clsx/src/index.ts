import type { API, FileInfo, Options } from "jscodeshift";

export default function transformer(
  file: FileInfo,
  api: API,
  options?: Options
) {
  const j = api.jscodeshift;
  const root = j(file.source);

  let oldImportName = "";

  const newImportDeclaration = j.importDeclaration(
    [j.importDefaultSpecifier(j.identifier("clsx"))],
    j.literal("clsx")
  );

  root
    .find(j.ImportDeclaration, { source: { value: "classnames" } })
    .forEach((path: any) => {
      const specifiers = path.value.specifiers;

      if (specifiers.length === 0) {
        oldImportName = "classnames";
      } else {
        oldImportName = specifiers[0].local.name;
      }

      path.replace(newImportDeclaration);
    });

  root
    .find(j.CallExpression, { callee: { name: oldImportName } })
    .forEach((path: any) => {
      path.value.callee.name = "clsx";
    });

  return root.toSource(options);
}
