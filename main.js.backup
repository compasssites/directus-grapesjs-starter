/*
 * Main entrypoint for the Directus GrapesJS Builder.
 *
 * This script wires up the GrapesJS editor, basic blocks, a custom
 * Directus repeater component, and connects to a Directus backend via the
 * official SDK. Users can select a Directus instance URL, choose a
 * collection and fields, and drop a repeater block that renders
 * items from that collection using Tailwind styled cards. Layouts can be
 * saved to and loaded from localStorage, and a preview mode is available.
 */

// Import only the pieces we need from the Directus SDK. These imports are
// resolved from the esm build served by jsDelivr. See the documentation
// showing usage of these functions for listing collections, fetching
// fields and reading items【694307837905587†L148-L156】【36310687525125†L468-L486】【681404300098900†L205-L215】.
import {
  createDirectus,
  rest,
  readCollections,
  readFieldsByCollection,
  readItems,
} from "https://cdn.jsdelivr.net/npm/@directus/sdk@latest/+esm";

// Global state variables
let directusClient = null; // Holds an authenticated Directus client instance
let selectedCollection = null; // Name of the collection currently selected in the sidebar
let selectedFields = []; // Array of field names selected for the repeater

// DOM references
const collectionsListEl = document.getElementById("collections-list");
const fieldsContainerEl = document.getElementById("fields-container");
const fieldsListEl = document.getElementById("fields-list");
const setSelectionBtn = document.getElementById("set-selection");

// Helper: populate the collections list in the sidebar
async function loadCollections() {
  try {
    const { data } = await directusClient.request(readCollections());
    collectionsListEl.innerHTML = "";
    data.forEach((col) => {
      const li = document.createElement("li");
      li.textContent = col.collection;
      li.className =
        "cursor-pointer px-2 py-1 rounded hover:bg-gray-200 transition-colors";
      li.addEventListener("click", () => selectCollection(col.collection));
      collectionsListEl.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    alert("Error loading collections: " + err.message);
  }
}

// Handle Directus connection button
document.getElementById("connect-btn").addEventListener("click", async () => {
  const url = document.getElementById("directus-url").value.trim();
  if (!url) {
    alert("Please enter a Directus URL");
    return;
  }
  try {
    // Initialize Directus client with REST composable as shown in docs【694307837905587†L148-L156】
    directusClient = createDirectus(url).with(rest());
    await loadCollections();
    alert("Connected! Select a collection from the list.");
  } catch (err) {
    console.error(err);
    alert("Failed to connect: " + err.message);
  }
});

// When a collection is clicked, load its fields
async function selectCollection(colName) {
  selectedCollection = colName;
  if (!directusClient) return;
  try {
    const { data } = await directusClient.request(
      readFieldsByCollection(colName),
    );
    // Clear previous fields
    fieldsListEl.innerHTML = "";
    data.forEach((field) => {
      // Each field gets a checkbox
      const wrapper = document.createElement("div");
      wrapper.className = "flex items-center space-x-1";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = field.field;
      checkbox.id = `field-${field.field}`;
      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = field.field;
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      fieldsListEl.appendChild(wrapper);
    });
    fieldsContainerEl.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    alert("Error loading fields: " + err.message);
  }
}

// When the user confirms field selection
setSelectionBtn.addEventListener("click", () => {
  const checkboxes = fieldsListEl.querySelectorAll("input[type='checkbox']");
  selectedFields = [];
  checkboxes.forEach((cb) => {
    if (cb.checked) selectedFields.push(cb.value);
  });
  if (!selectedFields.length) {
    alert("Please select at least one field.");
    return;
  }
  alert(`Selected fields: ${selectedFields.join(', ')}`);
  // Update the default content of the Directus repeater block so new blocks
  // reflect the chosen collection and fields
  const block = editor.BlockManager.get("directus-repeater");
  if (block) {
    block.set("content", {
      type: "directus-repeater",
      collection: selectedCollection || "",
      fields: selectedFields.join(","),
    });
  }
});

// Initialize GrapesJS editor
const editor = grapesjs.init({
  container: "#editor",
  height: "100%",
  fromElement: false,
  storageManager: false,
});

// Add basic blocks to the block manager
const blockManager = editor.BlockManager;
blockManager.add("heading", {
  label: "Heading",
  category: "Basic",
  content: '<h1 class="text-2xl font-bold">Heading</h1>',
});
blockManager.add("text", {
  label: "Text",
  category: "Basic",
  content: '<p class="text-base">Insert text here...</p>',
});
blockManager.add("image", {
  label: "Image",
  category: "Basic",
  content: {
    type: "image",
    src: "https://via.placeholder.com/600x400",
  },
});
blockManager.add("button", {
  label: "Button",
  category: "Basic",
  content:
    '<button class="bg-blue-600 text-white px-4 py-2 rounded">Click me</button>',
});

// Define a custom component type for Directus repeater
editor.DomComponents.addType("directus-repeater", {
  model: {
    defaults: {
      tagName: "div",
      // Traits allow editing attributes via the style manager sidebar
      traits: [
        {
          type: "text",
          name: "collection",
          label: "Collection",
          placeholder: "Collection name",
        },
        {
          type: "text",
          name: "fields",
          label: "Fields (comma separated)",
          placeholder: "id,title",
        },
      ],
      // Default properties
      collection: "",
      fields: "",
    },
    init() {
      // When collection or fields change, update the rendered content
      this.on("change:collection change:fields", this.updateContent);
      // Initial render
      this.updateContent();
    },
    updateContent() {
      const collection = this.get("collection");
      const fieldsStr = this.get("fields");
      const fieldArr = fieldsStr
        ? fieldsStr.split(",").map((f) => f.trim()).filter(Boolean)
        : [];
      // If there is no client or collection, show placeholder
      if (!directusClient || !collection) {
        this.components(
          '<div class="p-2 text-sm text-gray-500 italic">Select a Directus collection and fields via the trait panel.</div>',
        );
        return;
      }
      // Build query with optional fields array
      const query = {};
      if (fieldArr.length) {
        query.fields = fieldArr;
      }
      // Fetch items for the given collection and fields using readItems【681404300098900†L205-L215】
      directusClient
        .request(readItems(collection, query))
        .then(({ data }) => {
          let html = "";
          data.forEach((item) => {
            html += '<div class="bg-white border rounded p-3 mb-3 shadow-sm">';
            if (fieldArr.length) {
              fieldArr.forEach((f) => {
                const value = item[f] ?? "";
                html += `<p class="mb-1"><strong>${f}:</strong> ${value}</p>`;
              });
            } else {
              Object.keys(item).forEach((key) => {
                html += `<p class="mb-1"><strong>${key}:</strong> ${item[key]}</p>`;
              });
            }
            html += "</div>";
          });
          if (!html) {
            html =
              '<div class="p-2 text-sm text-gray-500 italic">No items found in this collection.</div>';
          }
          this.components(html);
        })
        .catch((err) => {
          console.error(err);
          this.components(
            `<div class="p-2 text-sm text-red-600">Failed to load data: ${err.message}</div>`,
          );
        });
    },
  },
});

// Register the block that inserts the custom component
blockManager.add("directus-repeater", {
  label: "Directus Repeater",
  category: "Directus",
  attributes: { class: "fa fa-database" },
  // Default content; updated via setSelectionBtn handler when fields are selected
  content: {
    type: "directus-repeater",
    collection: "",
    fields: "",
  },
});

// Saving the layout
function saveLayout() {
  const projectData = editor.getProjectData();
  localStorage.setItem(
    "directus-grapesjs-layout",
    JSON.stringify(projectData),
  );
  alert("Layout has been saved to your browser.");
}

// Loading the layout
function loadLayout() {
  const raw = localStorage.getItem("directus-grapesjs-layout");
  if (!raw) {
    alert("No saved layout found.");
    return;
  }
  try {
    const data = JSON.parse(raw);
    editor.loadProjectData(data);
    alert("Layout loaded successfully.");
  } catch (err) {
    console.error(err);
    alert("Failed to load layout: " + err.message);
  }
}

// Attach save and load handlers
document.getElementById("save-btn").addEventListener("click", saveLayout);
document.getElementById("load-btn").addEventListener("click", loadLayout);

// Toggle preview mode
let previewActive = false;
function togglePreview() {
  previewActive = !previewActive;
  editor.runCommand("preview", { activate: previewActive });
}
document.getElementById("preview-btn").addEventListener("click", togglePreview);
