# 飞象 AI 知识库 Demo

教师端知识库静态演示稿。打开 `index.html` 后，可按推荐路径浏览：

1. 新老师入门指南
2. 首次导入首页
3. 日常工作台
4. 文件预览
5. 我的题目
6. 最近对话
7. 演示顺序说明

## 在线访问

发布到 GitHub Pages 后，访问：

`https://djxky.github.io/fxaikb/`

## 本地预览

这是纯静态 demo，不需要安装依赖。

```bash
python3 -m http.server 5173
```

然后打开：

`http://localhost:5173/`

也可以直接双击 `index.html` 预览。若浏览器拦截新窗口，上传页和知识图谱跳转需要手动允许弹窗。

## 文件说明

- `index.html`：对外分享入口，推荐从这里开始看。
- `00-split-index.html`：团队内部演示脚本，标记上传前空态、上传动作、上传后解锁页面的顺序。
- `01-empty-onboarding.html` 到 `07-upload.html`：拆分后的演示页面。
- `kb-workbench.css` / `kb-workbench.js` / `kb-page-router.js`：拆分页共用样式与交互。
- `.nojekyll`：让 GitHub Pages 原样发布静态文件。

## 发布方式

仓库使用 GitHub Pages，从 `main` 分支根目录发布。所有资源使用相对路径，适合直接部署为静态站点。
