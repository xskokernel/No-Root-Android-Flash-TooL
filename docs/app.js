/* ============================================================
   MOFLASH 官网脚本
   - 自动拉取 GitHub 最新 Release（版本 / APK / 大小 / 更新日志）
   - 滚动入场动画、导航滚动状态
   ============================================================ */
(function () {
  "use strict";

  var OWNER = "xskokernel";
  var REPO = "No-Root-Android-Flash-TooL";
  var API_LATEST = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/releases/latest";
  var RELEASES_PAGE = "https://github.com/" + OWNER + "/" + REPO + "/releases";

  var el = {
    heroVersion: document.getElementById("hero-version"),
    heroDl: document.getElementById("hero-download"),
    heroDlText: document.getElementById("hero-download-text"),
    dlDesc: document.getElementById("dl-desc"),
    dlBtn: document.getElementById("dl-btn"),
    dlBtnText: document.getElementById("dl-btn-text"),
    dlNote: document.getElementById("dl-note"),
    year: document.getElementById("year"),
    nav: document.getElementById("nav")
  };

  /* ---------- 工具函数 ---------- */
  function fmtSize(bytes) {
    if (!bytes || isNaN(bytes)) return "";
    var mb = bytes / 1048576;
    return mb >= 1 ? mb.toFixed(1) + " MB" : (bytes / 1024).toFixed(0) + " KB";
  }

  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var p = function (n) { return n < 10 ? "0" + n : "" + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  function firstLines(text, n) {
    if (!text) return "";
    var lines = text.split("\n").filter(function (l) { return l.trim() !== ""; });
    // 遇到英文分隔行就截断，只展示中文段落
    var zh = [];
    for (var i = 0; i < lines.length; i++) {
      if (/^-{3,}$/.test(lines[i].trim())) break;
      if (/^english\s*:?$/i.test(lines[i].trim())) break;
      zh.push(lines[i].trim());
    }
    var arr = zh.length ? zh : lines;
    return arr.slice(0, n).join("\n");
  }

  /* ---------- 渲染最新版本 ---------- */
  function render(release) {
    var tag = release.tag_name || "";
    var name = release.name || tag;
    var apk = null;
    (release.assets || []).forEach(function (a) {
      if (!apk && /\.apk$/i.test(a.name)) apk = a;
    });

    if (el.heroVersion) el.heroVersion.textContent = name || tag || "最新版本";

    if (el.dlBtn && apk) {
      el.dlBtn.href = apk.browser_download_url;
    }
    if (el.heroDl && apk) {
      el.heroDl.href = apk.browser_download_url;
    }
    if (el.heroDlText) {
      el.heroDlText.textContent = apk ? "下载最新版" : "前往 Release";
    }
    if (el.dlBtnText) {
      el.dlBtnText.textContent = apk ? "下载 APK" : "前往 Release";
    }

    if (el.dlDesc) {
      var bits = [];
      if (name) bits.push(name);
      if (apk && apk.size) bits.push(fmtSize(apk.size));
      var date = fmtDate(release.published_at);
      if (date) bits.push("发布于 " + date);
      if (apk && typeof apk.download_count === "number") bits.push("下载 " + apk.download_count + " 次");
      el.dlDesc.textContent = bits.join("  ·  ") || "点击下方按钮前往 GitHub Release 下载";
    }

    if (el.dlNote) {
      var log = firstLines(release.body, 4);
      el.dlNote.textContent = log ? "本次更新：" + log.replace(/\n/g, " / ") : "";
    }
  }

  function fallback() {
    if (el.heroVersion) el.heroVersion.textContent = "最新版本";
    if (el.dlDesc) el.dlDesc.textContent = "前往 GitHub Release 获取最新安装包（含版本说明与历史版本）。";
    if (el.dlBtn) el.dlBtn.href = RELEASES_PAGE + "/latest";
  }

  /* ---------- 拉取 Release（失败静默降级到静态链接） ---------- */
  function loadRelease() {
    if (!window.fetch) { fallback(); return; }
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);

    fetch(API_LATEST, {
      headers: { Accept: "application/vnd.github+json" },
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) { clearTimeout(timer); render(data); })
      .catch(function () { clearTimeout(timer); fallback(); });
  }

  /* ---------- 导航滚动状态 ---------- */
  function onScroll() {
    if (!el.nav) return;
    el.nav.classList.toggle("scrolled", window.scrollY > 12);
  }

  /* ---------- 滚动入场 ---------- */
  function setupReveal() {
    var targets = document.querySelectorAll(
      ".feat, .tool, .shot, .spec, .warn, .dl-card, .login, .sec-head"
    );
    if (!("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    Array.prototype.forEach.call(targets, function (t, i) {
      t.classList.add("reveal");
      // 同组内做轻微错峰，避免整屏一起弹
      t.style.transitionDelay = (Math.min(i % 4, 3) * 70) + "ms";
      io.observe(t);
    });
  }

  /* ---------- 初始化 ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    if (el.year) el.year.textContent = new Date().getFullYear();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    setupReveal();
    loadRelease();
  });
})();