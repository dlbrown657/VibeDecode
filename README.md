# VibeDecode

VibeDecode is a local workspace for understanding a codebase and practicing how to explain it. Explore architecture diagrams, source excerpts, coding exercises, interview questions, and improvement ideas.

## Get started

Install Node.js 22.14 or newer. Clone or download the repository, then run these commands in its folder.

```sh
npm ci
npm run dev
```

Open [the sample workspace](http://127.0.0.1:3000/demo). The local app needs no account, API key, cloud service, worker, or upload scanner.

## Analyze your own project

1. In VibeDecode, run `npm run local:schema` to generate the current report schema.
2. Open the codebase you want to analyze in your preferred AI coding assistant. Give it the prompt below, replacing `VIBEDECODE_FOLDER` with the absolute path to your VibeDecode checkout.
3. Open [Local report](http://127.0.0.1:3000/local). Refresh after the assistant updates the report.

> Review this project as source text. Read VIBEDECODE_FOLDER/output/previews/report-schema.json and write a valid report to VIBEDECODE_FOLDER/output/previews/local-report.json. Keep the report under 2 MB. Use real project-relative file paths and line numbers. Explain the architecture and key features, and add project-specific interview questions and practice exercises. Use empty arrays for unsupported required lists and omit unsupported optional sections. Skip credentials, generated files, and dependencies. For runnable exercises, include standalone TypeScript code and JSON test cases. Do not run the project or install its dependencies.

The assistant reads the code and creates the report. VibeDecode validates and displays that report from its local file. Review generated explanations and tests before relying on them. If your assistant uses a cloud service, its privacy settings and billing apply.

The development server listens on `127.0.0.1:3000`. Private reports live under the ignored `output/previews` folder. Personal previews are excluded from production routes and packaging. Bookmarks and learning progress stay in the browser. Runnable JavaScript and TypeScript practice answers are checked locally in an isolated QuickJS environment with execution and memory limits.

## Compare local Git changes

With Git installed, run one of these from the VibeDecode folder:

```sh
npm run compare -- "/path/to/project"
npm run compare -- "/path/to/project" main HEAD
```

The first command captures staged and unstaged changes to tracked files against HEAD. The second compares two commits or refs. Open **Compare changes** in the app or visit [the comparison view](http://127.0.0.1:3000/compare). It shows the latest saved diff and a prompt for your coding assistant. Untracked files are listed by name. Binary contents and submodule changes are omitted.

Each capture replaces the previous comparison in the ignored `output/previews` folder. Keep this file private because a diff can contain secrets. Review what you share with your coding assistant.

Run `npm run check` to type-check, test, and build the project.
