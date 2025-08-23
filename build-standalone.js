const fs = require('fs');
const path = require('path');

// Read the built HTML file
const htmlPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Read the CSS file
const cssPath = path.join(__dirname, 'dist', 'style.css');
const css = fs.readFileSync(cssPath, 'utf8');

// Replace the module script with a regular script and move it to end of body
html = html.replace(
  /<script type="module" crossorigin src="\.\/game\.js"><\/script>/,
  ''
);

// Also handle the case where it might still be main.js
html = html.replace(
  /<script type="module" crossorigin src="\.\/main\.js"><\/script>/,
  ''
);

// Add the script tag at the end of the body with DOMContentLoaded wrapper
html = html.replace(
  /<\/body>/,
  '  <script>\n    document.addEventListener("DOMContentLoaded", function() {\n      const script = document.createElement("script");\n      script.src = "./game.js";\n      document.body.appendChild(script);\n    });\n  </script>\n</body>'
);

// Replace the CSS link with inline styles
html = html.replace(
  /<link rel="stylesheet" crossorigin href="\.\/style\.css">/,
  `<style>${css}</style>`
);

// Remove non-existent favicon references
html = html.replace(
  /<link rel="icon" type="image\/png" href="\.\/public\/favicon\.png">/,
  ''
);

html = html.replace(
  /<link rel="apple-touch-icon" href="\.\/public\/apple-touch-icon\.png">/,
  ''
);

// Write the modified HTML back
fs.writeFileSync(htmlPath, html);

// Delete the separate CSS file since it's now inlined
fs.unlinkSync(cssPath);

// Copy pokerserpent.jpeg to dist folder
const pokerserpentSrc = path.join(__dirname, 'pokerserpent.jpeg');
const pokerserpentDest = path.join(__dirname, 'dist', 'pokerserpent.jpeg');
if (fs.existsSync(pokerserpentSrc)) {
    fs.copyFileSync(pokerserpentSrc, pokerserpentDest);
    console.log('📷 Copied pokerserpent.jpeg to dist folder');
}

console.log('✅ Standalone build completed successfully!');
console.log('📁 Your game is ready in the dist/ folder');
console.log('🌐 You can now open dist/index.html directly in any browser');
