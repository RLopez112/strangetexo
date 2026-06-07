# Design Agent Skills Library

This directory contains web development skills for the design agent, organized by broad domain. Each skill houses specific `tools/` that the agent can execute or use as reference.

## Domains

- **`frontend-skill/`**: Skills and tools related to HTML/CSS, UI implementations, and frontend build processes.
- **`backend-skill/`**: Skills and tools related to server-side logic, API endpoints, and database interactions.
- **`testing-skill/`**: Skills and tools related to visual regression, unit testing, and integration testing.

## How to add a new tool to a skill

1. Pick the appropriate skill folder (e.g. `frontend-skill/`).
2. Inside its `tools/` directory, create a new folder for your tool (e.g. `glassmorphism_card/`).
3. Create a `<tool_name>-tool.md` file (e.g. `glassmorphism_card-tool.md`) that contains the instructions and purpose of the tool.
4. Add any associated code files, such as an `example.html` or executable scripts.
