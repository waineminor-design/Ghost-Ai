# Ghost AI

## Overview

Ghost AI is a real-time, collaborative system design
workspace. Users describe a system in plain English and an
AI agent maps that system onto a shared canvas as nodes and
edges. Collaborators refine the architecture together, live,
and the app then generates a technical specification
document (Markdown) from the resulting graph — a spec that
can be handed to a planning or coding agent to build from.
It is for developers and teams who want to design a system
before writing code, instead of discovering the architecture
halfway through a build.

## Goals

1. Let authenticated users create, rename, delete and open
   their own architecture projects.
2. Let multiple users edit the same canvas in real time with
   live cursors, presence and shared node/edge editing.
3. Let AI generate an initial architecture on the canvas
   from a natural-language prompt.
4. Let users start from a curated library of starter system
   design templates instead of a blank canvas.
5. Convert the canvas graph into a persistent, viewable and
   downloadable Markdown technical specification.
6. Run all long AI work in the background without blocking
   the UI, with live status shown to the user.

## Core User Flow

1. User signs in (or signs up) on the auth page.
2. User lands in the editor and sees their projects in the
   project sidebar (My Projects / Shared tabs).
3. User creates a new project, or opens an existing one
   (including projects shared with them).
4. The project's canvas opens in a shared real-time room.
5. User builds the architecture: drags nodes from the node
   panel, imports a starter template, or prompts the AI
   agent in the chat sidebar to generate a design.
6. The owner invites collaborators by email; collaborators
   join the same canvas and edit live (cursors, avatars).
7. Canvas changes are autosaved.
8. User generates a technical spec from the canvas in the
   Specs tab, views it, and downloads it as Markdown.

## Features

### Authentication and Projects

- Sign in / sign up with Clerk; route protection.
- Create, rename and delete projects (rename/delete are
  owner only).
- Project ownership and collaborator access by email.
- Sidebar lists owned projects ("My Projects") and projects
  shared with the user ("Shared").

### Collaborative Canvas

- React Flow canvas with custom nodes and edges (labels,
  resizing, colors), keyboard shortcuts (zoom, undo/redo)
  and a canvas control bar.
- Real-time collaboration via Liveblocks: live cursors,
  presence avatars, shared node/edge editing.
- Drag-and-drop node panel.
- Canvas autosave (snapshot to Vercel Blob).

### Starter System Designs

- Curated library of pre-built templates (e.g.
  microservices, CI/CD pipeline, event-driven system).
- Import a template into the canvas at any point during
  editing.

### AI Design Generation

- Chat sidebar where the user describes a system in plain
  English.
- AI output is structured as canvas nodes and edges and
  written onto the shared canvas.
- Runs as a Trigger.dev background task; progress is
  streamed back to the UI so the user can keep working.

### Technical Spec Generation

- Convert the canvas graph into a Markdown technical
  specification (background task).
- Persist the spec, view it in the Specs tab, and download
  it.

## Scope

### In Scope

- Clerk auth, project CRUD, ownership and collaborators
- Real-time collaborative canvas (React Flow + Liveblocks)
- Starter templates
- AI architecture generation from a prompt
- Markdown spec generation, viewing and download
- Background task processing with status (Trigger.dev)
- Deployment to Vercel

### Out of Scope

- Billing and subscription systems
- Enterprise permissions or role hierarchies beyond
  owner + collaborator
- Version history for specifications or canvases
- Custom WebSocket / realtime infrastructure (Liveblocks
  covers this)
- A traditional marketing homepage (users go straight to
  sign-in and the editor)

## Success Criteria

1. A signed-in user can create, open, rename and delete a
   project.
2. Unauthenticated users cannot reach the editor or any
   project data.
3. Multiple users can collaborate on the same canvas in
   real time and see each other's cursors and edits.
4. Only the owner and collaborators can access a project's
   canvas room.
5. A prompt produces an architecture on the canvas without
   blocking the UI.
6. A starter template can be imported onto the canvas.
7. The canvas graph can be converted into a persistent
   Markdown specification that can be viewed and
   downloaded.
8. The app builds and runs in production on Vercel.
