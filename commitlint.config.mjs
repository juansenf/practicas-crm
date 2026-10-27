/**
 * Reglas de Conventional Commits.
 * Se validan en CI y, opcionalmente, en local con `npm run lint:commits`.
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 100],
    "body-max-line-length": [1, "always", 120],
    "footer-max-line-length": [1, "always", 120],
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
    "scope-enum": [
      1,
      "always",
      [
        "auth",
        "clientes",
        "proyectos",
        "tareas",
        "ui",
        "db",
        "api",
        "docs",
        "test",
        "ci",
        "deps",
        "config",
      ],
    ],
  },
};
