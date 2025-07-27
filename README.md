# Directus GrapesJS Builder

This project implements a lightweight drag‑and‑drop web builder that integrates with a [Directus](https://directus.io/) backend.  It uses [GrapesJS](https://grapesjs.com/) for the visual editor and [Tailwind CSS](https://tailwindcss.com/) for styling.  The app lets you connect to any Directus instance, browse its collections and fields, and render collection items in a repeater block within the page you are designing.

## Features

* **Directus integration** – Configure a Directus URL and fetch available collections using the official JavaScript SDK.  Collections are loaded via `readCollections()`【694307837905587†L148-L156】 and fields via `readFieldsByCollection()`【36310687525125†L468-L486】.
* **Data binding** – Drop a **Directus Repeater** block onto your canvas to fetch items from the selected collection.  The block uses `readItems()` to retrieve data【681404300098900†L205-L215】 and renders each record in a simple card layout with Tailwind classes.
* **Basic content blocks** – Predefined blocks for headings, text, images and buttons make it easy to scaffold pages quickly.
* **Responsive sidebar** – A sidebar lists collections and lets you pick which fields to display.  Selected collections/fields are remembered for new repeater blocks.
* **Local save/load** – Use the **Save** and **Load** buttons to persist your layout in `localStorage` and restore it later.
* **Preview mode** – Toggle preview to hide the editor UI and see how the page will look to end users.

## Installation and running

No build step is required.  The project is a static HTML/JS application served directly from the browser.  You can preview it by cloning the repository and opening `index.html` in your browser or by serving the folder with a simple HTTP server.

```bash
git clone https://github.com/compasssites/directus-grapesjs-starter.git
cd directus-grapesjs-starter/project
# if you have python installed you can run a quick server (choose one of these commands):
python3 -m http.server 8000
# or:
npx serve
```

Then open `http://localhost:8000/index.html` in your browser.

> **Note:** The HTML file loads GrapesJS, Tailwind and the Directus SDK from public CDNs.  An internet connection is required at runtime.

## Usage

1. **Connect to Directus.**  In the top bar enter the base URL of your Directus project (for example `https://example.directus.app`) and click **Connect**.  The application uses the SDK’s `createDirectus().with(rest())` call【694307837905587†L148-L156】 to create a client and load collections.
2. **Choose a collection.**  The sidebar will list all available collections.  Click on one to fetch its fields.  Check the boxes next to the fields you want to display and click **Use Selected Fields**.
3. **Add a repeater block.**  Drag the **Directus Repeater** block from the “Directus” category onto your page.  The component’s traits (in the right sidebar) let you change the collection name or fields at any time.
4. **Add other content.**  Use the **Heading**, **Text**, **Image** or **Button** blocks from the “Basic” category to design the rest of your page.
5. **Preview.**  Click **Preview** in the top bar to toggle GrapesJS’s preview mode.
6. **Save and load layouts.**  Use **Save** to store your work in `localStorage` and **Load** to restore it.  Layouts are stored under the `directus-grapesjs-layout` key.

## Extending

The code is structured for easy extension.  New Directus‑based blocks can be added by registering additional component types via `editor.DomComponents.addType()` and then creating corresponding entries in the block manager.  You can also add more Tailwind classes to tweak the appearance of the repeater cards.  Consult the [Directus SDK documentation](https://directus.io/docs/api/) for more advanced query options such as filters, sorting and pagination.

## Limitations

* Authentication is not implemented.  The SDK is initialized without credentials, so only collections with public read access are available.  Integrating the `authentication()` composable would allow logged‑in access if needed.
* All configuration is stored in memory or `localStorage`.  A future version could persist layouts to Directus or another backend.

## License

This project is provided under the MIT License.
