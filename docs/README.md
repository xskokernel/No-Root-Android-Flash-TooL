# MOFLASH 官网

纯静态站点，零依赖、零构建，直接托管在 GitHub Pages。

## 目录结构

```
moflash_site/
├── index.html          首页（单页）
├── 404.html            404 页
├── style.css           深色液态玻璃样式
├── app.js              拉取最新 Release + 入场动画
├── assets/
│   ├── icon.png        应用图标（来自 app/src/main/res/drawable/app_icon.png）
│   ├── icon_rounded.png  圆角图标
│   └── shots/          界面截图 shot1~shot4.jpg
├── robots.txt
├── sitemap.xml
└── .nojekyll           让 Pages 原样输出静态文件
```

## 特性

- **版本自动同步**：页面加载时请求
  `api.github.com/repos/xskokernel/No-Root-Android-Flash-TooL/releases/latest`，
  自动填充版本名、APK 大小、发布日期、下载量、更新日志，并把下载按钮直链到最新 APK。
- **接口不可达时静默降级**：按钮回落到 `/releases/latest` 页面，不会出现空白或报错。
- **响应式**：桌面四列 / 平板两列 / 手机单列，截图自适应。
- **无障碍与动效**：尊重 `prefers-reduced-motion`。

## 部署（GitHub Pages）

### 方式一：独立仓库（推荐）

1. 新建仓库 `xskokernel/moflash-web`（或任意名）。
2. 把本目录**全部文件**推到该仓库 `main` 分支根目录。
3. 仓库 → Settings → Pages → Source 选择 `Deploy from a branch`，分支 `main` / 目录 `/ (root)`，保存。
4. 一分钟后访问 `https://xskokernel.github.io/moflash-web/`。

### 方式二：放到主仓库的子目录

1. 把本目录内容复制到主仓库的 `docs/` 目录并推送。
2. Settings → Pages → Source 选 `main` / `/docs`。
3. 访问 `https://xskokernel.github.io/No-Root-Android-Flash-TooL/`。

> 如果之后要在 `README.md` 里加入口，可以直接写：
> `官网：https://xskokernel.github.io/No-Root-Android-Flash-TooL/`

## 本地预览

```bash
cd moflash_site
python3 -m http.server 8080
# 打开 http://localhost:8080
```

## 自定义

| 想改的东西 | 位置 |
| --- | --- |
| 仓库 owner / repo | `app.js` 顶部 `OWNER` / `REPO` |
| 主色调 | `style.css` 里 `--accent` / `--accent-2` / `--accent-3` |
| 文案 | `index.html` 各 section |
| 截图 | 替换 `assets/shots/shot1~4.jpg`（保持同名即可） |
| 图标 | 替换 `assets/icon.png` 与 `assets/icon_rounded.png` |

## 注意

- 站点中**不包含**任何账号密码等敏感信息（仓库 README 里原有的登录提示未搬运）。
- 若 `api.github.com` 在部分网络环境不可达，仅影响“版本信息”展示，下载按钮仍指向 Releases 页面。
