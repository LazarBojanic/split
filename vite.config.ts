import { defineConfig } from 'vite-plus';

export default defineConfig({
  lint: {"jsPlugins":[{"name":"vite-plus","specifier":"vite-plus/oxlint-plugin"}],"rules":{"vite-plus/prefer-vite-plus-imports":"error"},"options":{"typeAware":true,"typeCheck":true}},
  fmt: {
    printWidth: 100,
    singleQuote: true,
    sortPackageJson: false,
    associations: [
      {
        files: ['*.html'],
        language: 'angular-html',
      },
    ],
    ignorePatterns: [],
  },
});
