/**
 * 本機 Mock Server：同時提供詳細頁 HTML 與假 API 回應。
 *
 * 啟動方式（在專案資料夾內）：
 *   node mock-server.js
 *
 * 瀏覽器開啟：
 *   http://localhost:8765/?token=vlWpJM5G
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8765;
const HTML_FILE = path.join(__dirname, "index.html");
const ASSETS_DIR = path.join(__dirname, "assets");

const MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".css": "text/css",
  ".js": "text/javascript",
};

const MOCK_EXAM_RESPONSE = {
  success: true,
  errorCode: "",
  message: "",
  data: {
    profile: {
      name: "T*m",
      gender: 1,
      birth: 787593600000,
    },
    data: {
      speed: 100.05,
      leftOffset: -1.758,
      rightOffset: 3.311,
      risk: 12.418,
      riskLevel: 1,
      date: 1789983273000,
    },
    news: {
      title: "板橋衛生所 9 月運動課程",
      content:
        "上課時間：每週○上午 9:30－10:30\n上課地點：板橋衛生所 2 樓○○教室\n報名方式：請洽衛生所服務櫃檯\n或聯絡陳小姐 09XX-XXX-XXX",
    },
  },
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (
    req.method === "GET" &&
    /^\/AllInOneAPI\/App\/exam\/get\/[^/]+$/.test(url.pathname)
  ) {
    sendJson(res, 200, MOCK_EXAM_RESPONSE);
    return;
  }

  if (
    req.method === "GET" &&
    (url.pathname === "/" || url.pathname === "/index.html")
  ) {
    try {
      const html = fs.readFileSync(HTML_FILE, "utf8");
      sendHtml(res, 200, html);
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        message: "無法讀取 index.html",
        error: error.message,
      });
    }
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/assets/")) {
    const filePath = path.join(__dirname, url.pathname);

    if (!filePath.startsWith(ASSETS_DIR)) {
      sendJson(res, 403, { success: false, message: "Forbidden" });
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        sendJson(res, 404, {
          success: false,
          message: "Not Found: " + url.pathname,
        });
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    });
    return;
  }

  sendJson(res, 404, {
    success: false,
    message: "Not Found: " + url.pathname,
  });
});

server.listen(PORT, () => {
  console.log("");
  console.log("FongAI Walk Kiosk Detail — Mock Server 已啟動");
  console.log("────────────────────────────────────────────");
  console.log("頁面：  http://localhost:" + PORT + "/?token=vlWpJM5G");
  console.log(
    "API：   http://localhost:" + PORT + "/AllInOneAPI/App/exam/get/vlWpJM5G",
  );
  console.log("靜態： http://localhost:" + PORT + "/assets/");
  console.log("");
  console.log("按 Ctrl+C 可停止伺服器");
  console.log("");
});
