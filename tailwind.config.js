/*
```bash # Initialize Node.js:
    npm init - y

```bash # Install Dependencies:
    npm install -D tailwindcss postcss autoprefixer


```bash # Initialize Tailwind Config:
    npx tailwindcss init - p


4. ** Create Input CSS:** Create a file named`input.css` in your project root with the following three lines:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
5.  **Build the CSS:** Run the following command. This reads `input.css`, scans `popup.html` (as defined in `tailwind.config.js`), and outputs the final, minimal, CSP-compliant CSS to a new file named `tailwind.css`.

```bash
npx tailwindcss - i./ input.css - o./ tailwind.css--minify


*/


/** @type {import('tailwindcss').Config} */
module.exports = {
    // CRITICAL: This line tells Tailwind to scan 'popup.html' for classes to include in the output CSS.
    content: ["./popup.html"],
    theme: {
        extend: {},
    },
    plugins: [],
}