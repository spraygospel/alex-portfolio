// Renders cv-src/cv.html to public/cv/resume.pdf using Playwright (already a devDependency).
// Run from the project root: node cv-src/generate.mjs
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "cv.html");
const outPath = path.join(__dirname, "..", "public", "cv", "resume.pdf");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("file://" + htmlPath);
await page.pdf({ path: outPath, format: "A4", printBackground: true });
await browser.close();
console.log("Generated:", outPath);
