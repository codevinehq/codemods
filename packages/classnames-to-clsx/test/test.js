var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { describe, expect, it } from "vitest";
import jscodeshift from "jscodeshift";
import transform from "../src/index.js";
const buildApi = (parser) => ({
    j: parser ? jscodeshift.withParser(parser) : jscodeshift,
    jscodeshift: parser ? jscodeshift.withParser(parser) : jscodeshift,
    stats: () => {
        console.error("The stats function was called, which is not supported on purpose");
    },
    report: () => {
        console.error("The report function was called, which is not supported on purpose");
    },
});
describe("classnames-to-clsx", () => {
    it("should transform classnames to clsx", () => __awaiter(void 0, void 0, void 0, function* () {
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
        const actualOutput = transform({
            path: "index.js",
            source,
        }, buildApi("tsx"));
        expect(actualOutput).toEqual(expected);
    }));
    it("should support alias import", () => __awaiter(void 0, void 0, void 0, function* () {
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
        const actualOutput = transform({
            path: "index.js",
            source,
        }, buildApi("tsx"));
        expect(actualOutput).toEqual(expected);
    }));
});
