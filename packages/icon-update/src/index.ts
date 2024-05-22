import { readFileSync } from "fs";
import type { API, ASTPath, FileInfo, JSXElement, Options } from "jscodeshift";

/*
 * Legacy code 1:
 * import Icon from '@benefex/react/redesign/Icon';
 *
 * const MyComponent = () => (
 *  <Icon name="icon-name" {...props} />
 * );
 */

/*
 * Legacy code 2:
 * import {Icon} from '@benefex/components';
 *
 * const MyComponent = () => (
 *  <Icon name="icon-name" {...props} />
 * );
 */

/*
 * New code:
 * import {Icon} from '@benefex/components';
 * import { IconName } from '@benefex/components/icons';
 *
 * const MyComponent = () => (
 * <Icon component={IconName} {...props} />
 * );
 *
 */

/*
 * New code supported props:
 * - component
 * - size
 * - variant
 * - label
 * - role
 */

const checkForUnsupportedProps = (path: ASTPath<JSXElement>) => {
  const supportedProps = ["name", "size", "variant", "label", "role"];

  path.node.openingElement.attributes?.forEach((attribute) => {
    if (attribute.type === "JSXSpreadAttribute") {
      throw new Error(`Unsupported prop found: ${attribute.type}`);
    }

    if (
      attribute.type === "JSXAttribute" &&
      !supportedProps.includes(
        attribute.name.type === "JSXIdentifier" ? attribute.name.name : ""
      )
    ) {
      throw new Error(`Unsupported prop found: ${attribute.name.name}`);
    }
  });
};

const IconNameMap: Record<string, string> = {};

export default function transformer(
  file: FileInfo,
  api: API,
  options?: {
    iconMapPath?: string;
  }
) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const { iconMapPath } = options || {};
  if (iconMapPath) {
    const iconMap = JSON.parse(readFileSync(iconMapPath, "utf-8"));
    Object.assign(IconNameMap, iconMap);
  }

  // Update '@benefex/react/redesign/Icon' import to '@benefex/components'
  const redesignIconImport = root.find(j.ImportDeclaration, {
    source: { value: "@benefex/react/redesign/Icon" },
  });
  const redesignIconImportSpecifier = redesignIconImport
    .find(j.ImportDefaultSpecifier)
    .nodes()[0]?.local?.name;

  if (redesignIconImportSpecifier) {
    redesignIconImport.replaceWith(
      j.importDeclaration(
        [
          j.importSpecifier(
            j.identifier("Icon"),
            j.identifier(redesignIconImportSpecifier)
          ),
        ],
        j.literal("@benefex/components")
      )
    );

    // Update Icon component usage
    root.findJSXElements(redesignIconImportSpecifier).forEach((path) => {
      checkForUnsupportedProps(path);

      path.replace(
        j.jsxElement(
          j.jsxOpeningElement(
            j.jsxIdentifier(redesignIconImportSpecifier),
            path.node.openingElement.attributes
          ),
          path.node.closingElement,
          path.node.children
        )
      );
    });
  }

  // Update '@benefex/components' icon to use 'component' prop
  const componentsIconImport = root.find(j.ImportDeclaration, {
    source: { value: "@benefex/components" },
  });
  const componentsIconImportSpecifier = componentsIconImport
    .find(j.ImportSpecifier, { imported: { name: "Icon" } })
    .nodes()[0]?.local;

  if (
    componentsIconImportSpecifier &&
    componentsIconImportSpecifier.type === "Identifier"
  ) {
    let newIcons: string[] = [];

    // Update Icon component usage
    root.findJSXElements(componentsIconImportSpecifier.name).forEach((path) => {
      checkForUnsupportedProps(path);

      const iconNamePath = path.node.openingElement.attributes?.find(
        (attribute) =>
          attribute.type === "JSXAttribute" &&
          attribute.name.type === "JSXIdentifier" &&
          attribute.name.name === "name"
      );
      const iconName =
        iconNamePath?.type === "JSXAttribute" &&
        iconNamePath.value?.type === "StringLiteral" &&
        iconNamePath.value.value;
      const newIconName = iconName ? IconNameMap[iconName] : null;

      if (!newIconName) {
        // Skip if icon name is not found in the map
        throw new Error(
          `Icon "${iconName}" not found in the map, aborting file.`
        );
      }

      path.replace(
        j.jsxElement(
          j.jsxOpeningElement(
            j.jsxIdentifier(componentsIconImportSpecifier.name),
            [
              j.jsxAttribute(
                j.jsxIdentifier("component"),
                j.jsxExpressionContainer(j.identifier(newIconName))
              ),
              ...(path.node.openingElement.attributes || []).filter(
                (attribute) =>
                  attribute.type === "JSXAttribute" &&
                  attribute.name.type === "JSXIdentifier" &&
                  attribute.name.name !== "name"
              ),
            ],
            true
          ),
          path.node.closingElement,
          path.node.children
        )
      );

      newIcons.push(newIconName);
    });

    componentsIconImport.insertAfter(
      j.importDeclaration(
        newIcons.map((icon) =>
          j.importSpecifier(j.identifier(icon), j.identifier(icon))
        ),
        j.literal("@benefex/components/icons")
      )
    );
  }

  return root.toSource(options);
}
