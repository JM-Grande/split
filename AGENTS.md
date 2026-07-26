# Split Project Instructions

This project has specific guidelines and context documented in the `context/` directory.

@./context/ai-interaction.md
@./context/coding-standards.md
@./context/current-feature.md
@./context/DESIGN.md
@~/xvault\Learnings\learnings.md
@./context/split-project-overview.md


## Dev Server Logs

When debugging runtime errors, check `dev.log` in the project root for live dev server output.
Start the server with logging: `npx next dev 2>&1 | Tee-Object -FilePath dev.log`


## Workflow

Follow the /feature strickly everytime I use it

## Agent skills

### Issue tracker

Issues are tracked as local markdown files in `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The default canonical label vocabulary is used. See `docs/agents/triage-labels.md`.

### Domain docs

The repo uses a single-context layout. See `docs/agents/domain.md`.


## Subagents 

Always create subagents for web search/Web Tool. Things that don't require refactor/change code only views, analyze and reports 
