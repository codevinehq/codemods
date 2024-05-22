import { describe, expect, it } from "vitest";
import jscodeshift, { API } from "jscodeshift";
import transform from "../src/index.js";

const buildApi = (parser: string | undefined): API => ({
  j: parser ? jscodeshift.withParser(parser) : jscodeshift,
  jscodeshift: parser ? jscodeshift.withParser(parser) : jscodeshift,
  stats: () => {
    console.error(
      "The stats function was called, which is not supported on purpose"
    );
  },
  report: () => {
    console.error(
      "The report function was called, which is not supported on purpose"
    );
  },
});

describe("icon-update", () => {
  it("should update benefex/redesign usage", async () => {
    const source = `
import Icon from "@benefex/react/redesign/Icon";

const App = () => {
  return <Icon name='hello' />;
};
    `.trim();

    const expected = `
import { Icon } from "@benefex/components";
import { HelloIcon } from "@benefex/components/icons";

const App = () => {
  return <Icon component={HelloIcon} />;
};
    `.trim();

    const actualOutput = transform(
      {
        path: "index.js",
        source,
      },
      buildApi("tsx")
    );

    expect(actualOutput).toEqual(expected);
  });

  it("should check benefex/redesign for unsupported props", async () => {
    const source = `
import Icon from "@benefex/react/redesign/Icon";

const App = () => {
  return <Icon name='hello' randomProp="hello" />;
};
    `.trim();

    expect(() =>
      transform(
        {
          path: "index.js",
          source,
        },
        buildApi("tsx")
      )
    ).toThrowError("Unsupported prop found: randomProp");
  });

  it("should update multiple benefex/redesign usage", async () => {
    const source = `
import Icon from "@benefex/react/redesign/Icon";

const App = () => {
  return <>
    <Icon name='hello' />;
    <Icon name='icon-name' />;
  </>;
};
    `.trim();

    const expected = `
import { Icon } from "@benefex/components";
import { HelloIcon, IconName } from "@benefex/components/icons";

const App = () => {
  return <>
    <Icon component={HelloIcon} />;
    <Icon component={IconName} />;
  </>;
};
    `.trim();

    const actualOutput = transform(
      {
        path: "index.js",
        source,
      },
      buildApi("tsx")
    );

    expect(actualOutput).toEqual(expected);
  });

  it("should update benefex/components usage", async () => {
    const source = `
import { Icon } from "@benefex/components";

const App = () => {
  return <Icon name='hello' />;
};
    `.trim();

    const expected = `
import { Icon } from "@benefex/components";

import { HelloIcon } from "@benefex/components/icons";

const App = () => {
  return <Icon component={HelloIcon} />;
};
    `.trim();

    const actualOutput = transform(
      {
        path: "index.js",
        source,
      },
      buildApi("tsx")
    );

    expect(actualOutput).toEqual(expected);
  });

  it("should throw for unmapped icons", async () => {
    const source = `
    import { Icon } from "@benefex/components";

    const App = () => {
      return <>
        <Icon name='random' />;
        <Icon name='icon-name' />;
      </>;
    };
        `.trim();

    expect(() =>
      transform(
        {
          path: "index.js",
          source,
        },
        buildApi("tsx")
      )
    ).toThrowError('Icon "random" not found in the map, aborting file.');
  });
  it("should update multiple benefex/components usage", async () => {
    const source = `
import { Icon } from "@benefex/components";

const App = () => {
  return <>
    <Icon name='hello' />;
    <Icon name='icon-name' />;
  </>;
};
    `.trim();

    const expected = `
import { Icon } from "@benefex/components";

import { HelloIcon, IconName } from "@benefex/components/icons";

const App = () => {
  return <>
    <Icon component={HelloIcon} />;
    <Icon component={IconName} />;
  </>;
};
    `.trim();

    const actualOutput = transform(
      {
        path: "index.js",
        source,
      },
      buildApi("tsx")
    );

    expect(actualOutput).toEqual(expected);
  });
});
