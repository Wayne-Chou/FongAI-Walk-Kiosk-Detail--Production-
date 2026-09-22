/**
 * 打包腳本：將上線所需檔案複製到 release/
 *
 * 使用方式（在專案資料夾內）：
 *   node build.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const RELEASE_DIR = path.join(ROOT, "release");
const HTML_FILE = "index.html";
const ASSETS_DIR = "assets";
const EXTRA_FILES = ["page.php", ".htaccess"];

function clearDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeDir(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
}

function removeDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeDir(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
  fs.rmdirSync(dir);
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function listFiles(dir, base = dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath, base));
    } else {
      files.push(path.relative(base, fullPath));
    }
  }
  return files.sort();
}

function formatBuildTime(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${y}${m}${d}-${hh}${mm}${ss}`;
}

function injectBuildVersion(htmlPath, buildTime) {
  const html = fs.readFileSync(htmlPath, "utf8");
  if (!html.includes("__BUILD_TIME__")) {
    console.warn("警告：找不到 __BUILD_TIME__ 佔位字串，版本標記未寫入");
    return buildTime;
  }
  const updated = html.split("__BUILD_TIME__").join(buildTime);
  fs.writeFileSync(htmlPath, updated, "utf8");
  return buildTime;
}

function main() {
  const htmlSrc = path.join(ROOT, HTML_FILE);
  const assetsSrc = path.join(ROOT, ASSETS_DIR);
  const htmlDest = path.join(RELEASE_DIR, HTML_FILE);

  if (!fs.existsSync(htmlSrc)) {
    console.error(`錯誤：找不到 ${HTML_FILE}`);
    process.exit(1);
  }
  if (!fs.existsSync(assetsSrc)) {
    console.error(`錯誤：找不到 ${ASSETS_DIR}/ 資料夾`);
    process.exit(1);
  }

  console.log("開始打包…");
  console.log("");

  if (fs.existsSync(RELEASE_DIR)) {
    console.log("清空舊的 release/ 資料夾…");
    clearDir(RELEASE_DIR);
  } else {
    fs.mkdirSync(RELEASE_DIR, { recursive: true });
  }

  console.log(`複製 ${HTML_FILE} …`);
  copyFile(htmlSrc, htmlDest);

  const buildTime = formatBuildTime();
  console.log(`寫入版本標記：${buildTime}`);
  injectBuildVersion(htmlDest, buildTime);

  console.log(`複製 ${ASSETS_DIR}/ …`);
  copyDir(assetsSrc, path.join(RELEASE_DIR, ASSETS_DIR));

  for (const fileName of EXTRA_FILES) {
    const src = path.join(ROOT, fileName);
    if (!fs.existsSync(src)) {
      console.warn(`警告：找不到 ${fileName}，略過`);
      continue;
    }
    console.log(`複製 ${fileName} …`);
    copyFile(src, path.join(RELEASE_DIR, fileName));
  }

  const files = listFiles(RELEASE_DIR);
  console.log("");
  console.log("打包成功！");
  console.log("────────────────────────────────────────────");
  console.log(`輸出路徑：${RELEASE_DIR}`);
  console.log(`版本標記：${buildTime}`);
  console.log("");
  console.log("包含檔案：");
  for (const file of files) {
    console.log(`  - ${file}`);
  }
  console.log("");
  console.log("已排除（不會複製）：mock-server.js、.vscode/ 及其他非上線檔案");
}

main();
