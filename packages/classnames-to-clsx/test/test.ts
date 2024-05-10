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

describe("classnames-to-clsx", () => {
  it("should transform classnames to clsx", async () => {
    const source = `
import classnames from 'classnames';
const classes = classnames('foo', 'bar');
const A = () => <div className={classnames('foo', 'bar')} />;
    `.trim();

    const expected = `
import clsx from "clsx";
const classes = clsx('foo', 'bar');
const A = () => <div className={clsx('foo', 'bar')} />;
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

  it("should support alias import", async () => {
    const source = `
import cn from 'classnames';
const classes = cn('foo', 'bar');
const A = () => <div className={cn('foo', 'bar')} />;
    `.trim();

    const expected = `
import clsx from "clsx";
const classes = clsx('foo', 'bar');
const A = () => <div className={clsx('foo', 'bar')} />;
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
