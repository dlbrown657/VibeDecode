# VibeDecode

VibeDecode helps you understand a codebase and practice explaining it. Explore a sample project or open a report made by your own AI coding assistant.

## Start VibeDecode

1. Install **Node.js 22.14 or newer**.
2. Download or clone VibeDecode. If you downloaded a ZIP, unzip it.
3. Open a terminal in the VibeDecode folder, where you see `package.json`, and run:

   ```sh
   npm ci
   npm run dev
   ```

4. Leave the terminal open and [open VibeDecode](http://127.0.0.1:3000).

VibeDecode opens your local report or shows you how to create one. You can also [try the sample](http://127.0.0.1:3000/demo) without an account or API key.

## Use it with your own project

**Your coding assistant writes the report. VibeDecode opens it.**

1. Leave VibeDecode running. In a second terminal, open the VibeDecode folder and run `npm run local:schema`. This creates a file that tells your assistant how to format the report.
2. Open the project you want to review in your AI coding assistant. Copy the message below and replace `VIBEDECODE_FOLDER` with the full path to your VibeDecode folder in both places.
3. When the assistant saves the report, open [Local report](http://127.0.0.1:3000/local). Refresh the page when you have a new report.

**Copy this into your coding assistant:**

```text
Read the code in my project. Explain its main features and how the code fits
together. Include interview questions, 10–15 distinct LeetCode-style coding
exercises, and at least 5 resume bullets backed by the code.

Make each exercise different in the skill it tests or the kind of problem it
asks me to solve. Tie it to a real file or feature and prioritize the language
used there. For small projects, label exercises that extend a real pattern as
practice variations. Keep resume bullets factual and avoid invented numbers,
features, or outcomes.

Follow the format in:
VIBEDECODE_FOLDER/output/previews/report-schema.json

Save the report here:
VIBEDECODE_FOLDER/output/previews/local-report.json

Keep it under 2 MB. Cite real file paths and line numbers from my project.
Skip secrets, dependencies, and generated files. Review the code as text
without running it. Leave out optional sections you cannot support with evidence.
```

VibeDecode reads the saved report locally. Your coding assistant’s own privacy settings and usage charges still apply.

## Compare code changes

If you have Git installed, run this from the VibeDecode folder. Replace the example path with the folder of the project you want to compare.

```sh
npm run compare -- "/path/to/your/project"
```

Open [Compare changes](http://127.0.0.1:3000/compare) to see your tracked changes and a prompt you can give your coding assistant. To compare two specific commits or branches, add both refs, such as `main HEAD`. Each capture replaces the previous comparison. Review the diff before sharing it.

## Run the project checks

Run `npm run check` to type-check, test, and build VibeDecode.
