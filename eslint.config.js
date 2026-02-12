import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  tseslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  globalIgnores(["dist/*", "src/pages*", "eslint.config.js", "vite.config.ts"]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "function",
          format: ["snake_case"],
        },
        {
          selector: "parameter",
          format: ["snake_case"],
          leadingUnderscore: "allow",
        },
        {
          selector: "variable",
          modifiers: ["const", "global"],
          format: ["UPPER_CASE", "snake_case", "PascalCase"],
        },
        {
          selector: "variable",
          format: ["snake_case"],
        },
        {
          selector: "classMethod",
          format: ["snake_case"],
        },
        {
          selector: "classMethod",
          filter: {
            regex:
              "^(connectedCallback|disconnectedCallback|attributeChangedCallback|adoptedCallback)$",
            match: true,
          },
          format: null,
        },
        {
          selector: "accessor",
          format: ["snake_case"],
        },
        {
          selector: "classProperty",
          format: ["snake_case"],
          leadingUnderscore: "allow",
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
      ],
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  }
);
