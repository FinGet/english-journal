// Webpack's require.context (used by src/Root.tsx to discover local episodes).
declare namespace NodeJS {
  interface Require {
    context(directory: string, useSubdirectories: boolean, regExp: RegExp): { keys(): string[]; (id: string): unknown };
  }
}
