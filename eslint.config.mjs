import { defineConfig } from "eslint/config";
import jest from "eslint-plugin-jest";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    extends: compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:jest/recommended",
        "prettier",
    ),

    plugins: {
        jest,
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...jest.environments.globals.globals,
            ...globals.browser,
            ...globals.jquery,
            dat: true,
            THREE: true,
            NodeJS: true,
            editor: true,
        },

        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "script",

        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    rules: {
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "no-unreachable": "error",
        "no-undef": "error",
        "max-lines-per-function": ["warn", 100],

        "@typescript-eslint/naming-convention": ["warn", {
            selector: ["variable", "function", "parameter", "property", "method"],
            format: ["camelCase"],
        }, {
            selector: ["class", "interface", "typeAlias"],
            format: ["PascalCase"],
        }],
    },
}]);