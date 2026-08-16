import fs from "node:fs";

const root = "D:/POC/AI Test Failure Analyzer";
const shots = `${root}/docs/screenshots`;

function toDataUri(path) {
  const buf = fs.readFileSync(path);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

let html = fs.readFileSync(`${root}/presentation/template.html`, "utf8");

html = html.replace("{{IMG_DASHBOARD}}", toDataUri(`${shots}/dashboard.png`));
html = html.replace("{{IMG_RESULTS}}", toDataUri(`${shots}/analyze-results.png`));
html = html.replace("{{IMG_DEFECT}}", toDataUri(`${shots}/defect-generated.png`));

fs.writeFileSync(`${root}/presentation/presentation.html`, html);
console.log("Built presentation.html:", (html.length / 1024 / 1024).toFixed(2), "MB");
