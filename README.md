# directus-grapesjs-starter
A directus specific frontenddrag and drop builder. 

name: directus-grapesjs-builder
description: |
  Build a drag-and-drop visual frontend builder using GrapesJS that integrates with Directus as a backend. 
  The builder should allow a user to configure a Directus URL per app, authenticate, and then dynamically bind components to collections in that instance.
goals:
  - Scaffold a working web builder using GrapesJS and Tailwind CSS
  - Allow setting a Directus instance URL at the app level (stored in memory for now)
  - After Directus URL is entered, fetch and list all collections using @directus/sdk
  - Create a sidebar UI for the user to:
      - Pick a collection
      - Select which fields to display
  - Create a custom block called "DirectusRepeater" that:
      - Fetches data from the selected collection
      - Renders each item using Tailwind card layout
  - Add basic static blocks: Heading, Text, Image, Button
  - Enable local save/load of layout as JSON
  - Add "Preview" mode toggle to see app as end-user
  - Structure the code to be easily extendable with more Directus-based blocks
  - Push the complete working builder to https://github.com/compasssites/directus-grapesjs-starter

instructions:
  - Use Vite or plain HTML + JS bundler to keep it lightweight
  - Prefer Vanilla JS where possible; use ES modules
  - GrapesJS config must use blocks and traits properly
  - Use @directus/sdk for auth + data fetch
  - No hardcoded credentials
  - Provide default fallback layout if Directus isn't connected
  - UI should be responsive (Tailwind CSS preferred)
  - Save layout config in localStorage (for now)

output:
  - A public GitHub repo with working GrapesJS builder
  - README with install & run instructions
  - All code pushed to `main` branch of compasssites/directus-grapesjs-starter
