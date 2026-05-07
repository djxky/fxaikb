// ============ 知识图谱：跳转研发实时数据 demo ============
  // 决策（2026-05-07）：v1 阶段不再自建知识图谱可视化，复用研发已上线的 Wiki 血缘图 demo。
  // 理由：① 数据真实（KB 3 实数据）② 零开发 ③ 避免我们/研发两份图将来分裂。
  // 风险：URL 是 fedebug 联调环境，有可能 404 / 改路径，演示前需手动验证一次。
  // 兜底：本地 graph.html 暂时保留，不在任何入口暴露；如需切回，把 openGraphDemo() 改回 setState('graph') 即可。
  const KNOWLEDGE_GRAPH_DEMO_URL = 'https://mapi.feixiangxingqiu.biz/fedebug/agora/feat/wiki-knowledge-graph/index.html#/knowledge-graph?kbId=3';
  function openGraphDemo(){
    window.open(KNOWLEDGE_GRAPH_DEMO_URL, '_blank', 'noopener,noreferrer');
  }

  // 中栏状态切换：empty / onboarding-scan / onboarding-progress / default / source
  function setState(state){
    // v3.3+ 副作用：任何 setState 调用都意味着老师要"看中栏的某个东西"
    // 自动退出 focus-chat 模式（不影响 banner — banner 由 _openArtifactInCenterPreservingHistory 决定保留与否）
    const layout = document.querySelector('.layout');
    if(layout && layout.classList.contains('focus-chat')){
      layout.classList.remove('focus-chat');
    }

    document.querySelectorAll('.state').forEach(el=>{
      el.classList.toggle('active', el.dataset.state===state);
    });
    document.getElementById('main-center').scrollTop = 0;

    // graph 态：懒加载 iframe（首次切到时才 src，节省初始加载）
    if(state === 'graph'){
      const iframe = document.getElementById('graph-iframe');
      if(iframe && iframe.src.indexOf('graph.html') === -1){
        iframe.src = 'graph.html?embed=1';
      }
    }

    // 左下"知识图谱"导航高亮
    const navGraph = document.getElementById('nav-graph');
    if(navGraph) navGraph.classList.toggle('active', state === 'graph');

    // 同步右栏对话上下文标记 + 副标题
    const ctx = document.getElementById('composer-context');
    const sub = document.getElementById('chat-context-subtitle');
    const cphHead = document.querySelector('.chat-panel-head');

    cphHead.classList.remove('empty-state');
    const sbR = document.getElementById('sidebar-right');
    sbR.classList.remove('empty');
    if(state === 'source'){
      ctx.style.display = 'inline-flex';
      sub.textContent = '已锁定当前文件';
    }else if(state === 'welcome'){
      ctx.style.display = 'none';
      sub.textContent = '查看入门对话';
    }else if(state === 'welcome-doc'){
      ctx.style.display = 'none';
      sub.textContent = '浏览入门指南中';
    }else if(state === 'recent-chat-view'){
      ctx.style.display = 'none';
      sub.textContent = '正在回顾历史对话';
    }else if(state === 'graph'){
      ctx.style.display = 'none';
      sub.textContent = '浏览知识图谱中';
    }else if(state === 'empty' || state === 'onboarding-scan' || state === 'onboarding-progress'){
      ctx.style.display = 'none';
      cphHead.classList.add('empty-state');
      sbR.classList.add('empty');
      if(state === 'empty')                 sub.textContent = '需要时叫我';
      if(state === 'onboarding-scan')       sub.textContent = '需要时叫我';
      if(state === 'onboarding-progress')   sub.textContent = '需要时叫我';
    }else{
      ctx.style.display = 'none';
      sub.textContent = '需要时叫我';
    }

    // v3.6 P0-1：左栏「按文件浏览 / 按题目浏览」高亮同步
    // 题库相关 state（qbank / qbank-empty）→ 题目浏览高亮；其他 → 文件浏览高亮
    const isQbankState = (state === 'qbank' || state === 'qbank-empty');
    const fileLbl = document.querySelector('.file-view-label');
    const qbkLbl  = document.querySelector('.qbank-label');
    if(fileLbl) fileLbl.classList.toggle('active', !isQbankState);
    if(qbkLbl)  qbkLbl.classList.toggle('active', isQbankState);

    if(window.lucide) lucide.createIcons();
  }

  /* 打开 AI 产物文件预览（从对话气泡里的 Artifact 卡片触发）
     设计动线：最近对话 › 你好 · 介绍下你自己 (state-welcome) → 文件卡片 → 入门指南.html (state-welcome-doc) */
  function openWelcomeDoc(){
    setState('welcome-doc');
  }

  /* ===== 最近对话 mock 数据（v3.4 重构）=====
     每条对话字段：
       - title / time / rounds / artifacts: 元信息
       - messages: 对话气泡流（含产物卡片）
       - primaryArtifactState: 中栏打开主产物时切换到哪个 state（默认 'source'，入门指南用 'welcome-doc'）
     规则（v3.4 用户敲定）：
       - 有产物（artifacts > 0）→ 三栏：中栏=最新产物 + 右栏=对话历史
       - 无产物（artifacts === 0）→ focus-chat：中栏隐藏 + 右栏放大显示对话流 */
  const RECENT_CHATS = {
    'chat-welcome': {
      title: '你好 · 介绍下你自己',
      time: '今天 14:00',
      rounds: 1,
      artifacts: 1,
      primaryArtifactState: 'welcome-doc',  // 入门指南用专属预览态
      messages: [
        { role:'user', text:'你好，介绍一下你自己' },
        { role:'ai', text:'你好张老师！我是<b>飞象 AI</b>——你的备课助手。跟通用 AI 不一样的是：<b>我读过你的备课资料</b>，所以能基于你的课件、真题、错例帮你做事，不是凭空写。我专门为你做了一份图文 + 视频版的使用指南：',
          artifact:{ name:'飞象 AI · 入门指南', ext:'.html', desc:'含 2 分钟视频 + 三步上手 + 4 个常用场景', meta:[{i:'video',t:'视频 2:30'},{i:'clock-3',t:'约 2 分钟阅读'}] } }
      ]
    },
    'chat-fnxxk': {
      title: '设计一节函数复习课',
      time: '今天 10:08',
      rounds: 3,
      artifacts: 2,
      primaryArtifactState: 'source',
      messages: [
        { role:'user', text:'设计一节二次函数复习课，重点突破"图像与系数关系"' },
        { role:'ai', text:'参考你 11 月真题，"a/b/c 系数判断"是你班错率最高的题型（错率 47%）。我设计了一节 40 分钟的精讲课，包含 3 个核心环节：',
          artifact:{ name:'函数复习课 · 教学设计', ext:'.docx', desc:'40 分钟教案 · 含 3 个核心环节 + 配套例题 5 道', meta:[{i:'clock-3',t:'约 1200 字'},{i:'book-open',t:'教案'}] } },
        { role:'user', text:'再帮我配 10 道课后练习，难度梯度稍微缓一些' },
        { role:'ai', text:'好的，按"基础 4 → 中等 4 → 拔高 2"梯度，参考了你之前发过的真题难度：',
          artifact:{ name:'配套练习 · 10 题', ext:'.docx', desc:'基础 4 + 中等 4 + 拔高 2 · 含答案与解析', meta:[{i:'clock-3',t:'约 800 字'},{i:'file-edit',t:'练习'}] } }
      ]
    },
    'chat-bsst': {
      title: '出 10 道二次函数变式题',
      time: '昨天 16:42',
      rounds: 1,
      artifacts: 1,
      primaryArtifactState: 'source',
      messages: [
        { role:'user', text:'出 10 道二次函数选择题，要包含 a/b/c 系数判断，难度参考我去年的真题' },
        { role:'ai', text:'参考你去年的《二次函数·真题集 2024》第 3-5 题难度，已生成 10 道选择题。每道题都标注了考点和易错选项：',
          artifact:{ name:'二次函数变式题 · 10 道', ext:'.docx', desc:'选择题 · 全部含答案 + 易错选项分析', meta:[{i:'clock-3',t:'约 600 字'},{i:'file-edit',t:'变式题'}] } }
      ]
    },
    'chat-qdsjx': {
      title: '全等三角形错题讲评思路',
      time: '04-22 09:15',
      rounds: 2,
      artifacts: 1,
      primaryArtifactState: 'source',
      messages: [
        { role:'user', text:'你帮我整理一下八(3)班全等三角形单元的错题讲评要点' },
        { role:'ai', text:'已分析你班这次月考的错题分布。错率最高的是"添加辅助线"类题目（错率 62%）。讲评建议从这 4 个常见思路切入：',
          artifact:{ name:'全等三角形 · 讲评要点', ext:'.docx', desc:'4 大错因 + 4 类辅助线方法 + 5 道典型错题分析', meta:[{i:'clock-3',t:'约 1500 字'},{i:'line-chart',t:'讲评'}] } },
        { role:'user', text:'第 3 个思路再展开一下' },
        { role:'ai', text:'"截长补短法"展开如下：当题目出现一条线段等于另两条之和时，优先考虑这种方法。给你举两个例子......（继续讲解）' }
      ]
    },
    /* 演示无产物对话（罕见 case：纯文字检索 / 解释类）— focus-chat 模式 */
    'chat-noartifact': {
      title: '问 a/b/c 系数原理',
      time: '04-20 15:30',
      rounds: 2,
      artifacts: 0,
      messages: [
        { role:'user', text:'a、b、c 三个系数对二次函数图像分别有什么影响？我想口头讲清楚' },
        { role:'ai', text:'好的，简单说：<br/><br/><b>a</b>：决定开口（正向上、负向下），绝对值越大开口越窄；<br/><b>b</b>：跟 a 一起决定对称轴位置（对称轴 x = -b/2a）；<br/><b>c</b>：函数图像与 y 轴交点（直接看常数项就行）。<br/><br/>你可以用"AAB 同号轴在左，AAB 异号轴在右"这个口诀讲。' },
        { role:'user', text:'谢谢' },
        { role:'ai', text:'不客气，需要出几道相关题就告诉我。' }
      ]
    }
  };

  /* ===== v3.3 内容驱动布局 =====
     setLayoutMode(mode):
       - 'default'   : 三栏（左 + 中 + 右），看文件 + AI 助手在右
       - 'focus-chat': 中栏隐藏，对话占据中+右整块（新建对话 / 历史回顾）
     原则：layout-mode 跟 setState 是两个正交维度
       - layout 决定栏位形态
       - state 决定中栏内容（focus-chat 时中栏隐藏，state 不重要） */
  function setLayoutMode(mode){
    const layout = document.querySelector('.layout');
    if(!layout) return;
    layout.classList.toggle('focus-chat', mode === 'focus-chat');
    if(mode !== 'focus-chat'){
      // 离开 focus-chat：卸 has-zen-welcome + 清掉残留的欢迎页 DOM
      // （防止用户导航回三栏时 zen-welcome 孤悬在窄 400px 右栏里）
      const sbR = document.getElementById('sidebar-right');
      if(sbR) sbR.classList.remove('has-zen-welcome');
      const zenEl = document.querySelector('[data-zen-welcome]');
      if(zenEl) zenEl.remove();
    }
  }

  /* 缓存"主对话"的 HTML — 进入历史回顾时备份，退出时恢复
     避免每次 exit 都要重写主对话内容 */
  let mainChatStreamHTML = null;
  /* 当前回顾对话的标题（产物面包屑等地方需要读取） */
  let currentChatTitle = '';

  /* 打开最近对话回顾（v3.4 重构 — 按"是否有产物"分流）
     规则：
       - 有产物 → default 三栏：中栏自动打开最新产物文件 + 右栏切到该对话历史
       - 无产物 → focus-chat：中栏隐藏 + 右栏放大显示对话流
     入口统一：左栏「最近对话」所有列表项点击都走这个函数 */
  function openRecentChat(chatId){
    if(chatId === 'chat-welcome' && document.body && document.body.dataset.page === 'recent-chat'){
      window.location.href = '06-welcome-guide.html?chat=chat-welcome';
      return;
    }

    const data = RECENT_CHATS[chatId];
    if(!data){ showToast('该对话内容暂未准备 demo 数据'); return; }

    const stream = document.getElementById('chat-stream');
    if(!stream) return;

    // 备份主对话（首次进入回顾时才备份）
    if(mainChatStreamHTML === null){
      mainChatStreamHTML = stream.innerHTML;
    }

    // 关键：摘掉右栏的 empty 类（新用户场景下 .sidebar-right.empty 会强制隐藏 .stream-msg）
    // 否则进入回顾态后渲染的对话气泡都会被 CSS 隐藏，右栏看起来是空的
    const sbR = document.getElementById('sidebar-right');
    if(sbR) sbR.classList.remove('empty');

    // 渲染历史对话到右栏 chat-stream
    stream.innerHTML = '<div class="stream-day">' + data.title + ' · ' + data.time + '</div>'
      + data.messages.map((m, idx) => {
      const time = data.time.split(' ')[1] || data.time;
      const meta = m.role === 'user'
        ? '<span class="smh-time">'+time+'</span><span class="smh-name">你</span>'
        : '<span class="ai-pulse-dot"></span><span class="smh-name">飞象 AI</span><span class="smh-time">'+time+'</span>';
      let bubble = '<div class="stream-bubble">' + m.text;
      if(m.artifact){
        const a = m.artifact;
        const tags = a.meta.map(x => '<span class="rcv-art-tag"><i data-lucide="'+x.i+'"></i>'+x.t+'</span>').join('');
        const safeName = a.name.replace(/'/g,"\\'");
        const stateForArt = data.primaryArtifactState || 'source';
        bubble += '<div class="rcv-artifact" onclick="openArtifactInCenter(\''+safeName+'\',\''+a.ext+'\',\''+stateForArt+'\')">'
                +   '<div class="rcv-art-icon"><i data-lucide="file-text"></i></div>'
                +   '<div class="rcv-art-body">'
                +     '<div class="rcv-art-name">'+a.name+'<span class="rcv-art-ext">'+a.ext+'</span></div>'
                +     '<div class="rcv-art-desc">'+a.desc+'</div>'
                +     '<div class="rcv-art-meta">'+tags+'</div>'
                +   '</div>'
                +   '<div class="rcv-art-actions">'
                +     '<button class="rcv-art-btn primary" onclick="event.stopPropagation();openArtifactInCenter(\''+safeName+'\',\''+a.ext+'\',\''+stateForArt+'\')"><i data-lucide="eye"></i>预览</button>'
                +     '<button class="rcv-art-btn ghost" onclick="event.stopPropagation();showToast(\'✓ 已保存到「我的知识库 › 数学 › 八下·二次函数」\')"><i data-lucide="bookmark-plus"></i>保存到我的知识库</button>'
                +   '</div>'
                + '</div>';
      }
      bubble += '</div>';
      return '<div class="stream-msg '+m.role+'"><div class="stream-msg-head">'+meta+'</div>'+bubble+'</div>';
    }).join('');

    // 记录当前回顾的对话标题（供产物面包屑等读取）
    currentChatTitle = data.title;

    // 顶部副标题改为"在回顾历史对话: xxx"（v3.6 起右栏不再有 in-history「+」按钮，由顶栏「新对话」承接退出动作）
    const sub = document.getElementById('chat-context-subtitle');
    if(sub) sub.textContent = '在回顾：' + data.title;

    // 找该对话最后一个产物（"主产物"）
    const lastArtifactMsg = [...data.messages].reverse().find(m => m.artifact);

    if(lastArtifactMsg){
      // 有产物 → default 三栏：中栏开主产物
      setLayoutMode('default');
      const a = lastArtifactMsg.artifact;
      const stateForArt = data.primaryArtifactState || 'source';
      _openArtifactInCenterPreservingHistory(a.name, a.ext, stateForArt);
    } else {
      // 无产物 → focus-chat：右栏放大
      setLayoutMode('focus-chat');
    }

    // 高亮左栏当前对话项
    document.querySelectorAll('#recent-chat-list .tree-row').forEach(el => el.classList.remove('active'));
    const navItem = document.querySelector('#recent-chat-list .tree-row[data-chat-id="'+chatId+'"]');
    if(navItem) navItem.classList.add('active');

    if(window.lucide) lucide.createIcons();
    stream.scrollTop = 0;
  }

  /* 内部辅助：在保留对话历史前提下，打开产物到中栏（绕过 setState 的"擦除回顾"行为）
     - welcome-doc：入门指南专属预览（HTML 内容已固化在 state-welcome-doc 里，不动）
     - source：通用产物预览（注入面包屑 / 标题 / 文件类型 / 操作 / 预览占位） */
  function _openArtifactInCenterPreservingHistory(name, ext, stateName){
    const layout = document.querySelector('.layout');
    if(layout) layout.classList.remove('focus-chat');

    const shouldRenderWelcomeFallback = stateName === 'welcome-doc' && !document.querySelector('.state-welcome-doc');
    if(shouldRenderWelcomeFallback){
      stateName = 'recent-chat-view';
    }

    // 直接切 state 不走 setState 的副作用（保留 banner + 对话历史）
    document.querySelectorAll('.state').forEach(el=>{
      el.classList.toggle('active', el.dataset.state===stateName);
    });
    const mc = document.getElementById('main-center');
    if(mc) mc.scrollTop = 0;

    if(stateName === 'source'){
      // 1. 面包屑 — 改为"最近对话 › <对话标题> › <产物名>.<ext>"
      const chatTitle = currentChatTitle || '最近对话';
      const breadcrumb = document.querySelector('.state-source .src-breadcrumb');
      if(breadcrumb){
        breadcrumb.innerHTML = `
          <span class="src-bc-item" onclick="exitRecentChat()">最近对话</span>
          <i data-lucide="chevron-right" class="src-bc-sep"></i>
          <span class="src-bc-item">${chatTitle}</span>
          <i data-lucide="chevron-right" class="src-bc-sep"></i>
          <span class="src-bc-item current">${name}${ext}</span>
        `;
      }

      // 2. 文件头只保留标题
      const titleEl = document.querySelector('.source-head-title');
      if(titleEl) titleEl.textContent = name;

      // 3. 预览区 — 替换为产物文档样式预览（不再展示 PPT 翻页）
      const preview = document.querySelector('.state-source .source-preview');
      if(preview){
        preview.innerHTML = _renderArtifactPreviewHTML(name, ext);
      }
    } else if(shouldRenderWelcomeFallback){
      _renderWelcomeGuideFallbackInRecentView(name, ext);
    }

    const ctxName = document.getElementById('composer-context-name');
    if(ctxName) ctxName.textContent = name + ext;
    if(window.lucide) lucide.createIcons();
  }

  function _renderWelcomeGuideFallbackInRecentView(name, ext){
    const title = document.getElementById('rcv-title');
    const titleBc = document.getElementById('rcv-title-bc');
    const time = document.getElementById('rcv-meta-time');
    const rounds = document.getElementById('rcv-meta-rounds');
    const artifacts = document.getElementById('rcv-meta-artifacts');
    const stream = document.getElementById('rcv-stream');

    if(title) title.textContent = name;
    if(titleBc) titleBc.textContent = '你好 · 介绍下你自己 › ' + name + ext;
    if(time) time.innerHTML = '<i data-lucide="clock-3"></i>今天 14:00';
    if(rounds) rounds.innerHTML = '<i data-lucide="video"></i>视频 2:30';
    if(artifacts) artifacts.innerHTML = '<i data-lucide="file-text"></i>入门指南';
    if(!stream) return;

    stream.innerHTML = `
      <article class="art-doc-preview">
        <h1>飞象 AI · 入门指南</h1>
        <p class="art-doc-sub">给新老师的 2 分钟上手说明 · 先理解飞象能做什么，再上传自己的资料</p>

        <h2>你可以把飞象理解成什么？</h2>
        <p>通用 AI 没读过你的备课资料；飞象读过。你把课件、教案、真题、错例放进来后，飞象会保留原文件结构，并在右侧 AI 里基于这些素材回答问题。</p>

        <h2>三步上手</h2>
        <ol>
          <li><b>上传资料：</b>先把 PPT / Word / PDF / 试卷照片导入知识库。</li>
          <li><b>打开素材：</b>在工作台点开课件或试卷，右侧 AI 会锁定当前上下文。</li>
          <li><b>让 AI 做事：</b>让飞象出题、写教案、讲评错题，满意后保存到知识库。</li>
        </ol>

        <h2>4 个常用场景</h2>
        <p><b>备课：</b>把这份课件改成 8 年级难度。</p>
        <p><b>出题：</b>基于二次函数错题出 10 道变式题。</p>
        <p><b>讲评：</b>总结这次月考最容易错的知识点。</p>
        <p><b>检索：</b>找到去年讲过的那张二次函数 PPT。</p>

        <p class="art-doc-tail">— 上传前，这里只展示入门说明；上传后才展示老师自己的素材和产物 —</p>
      </article>
    `;
  }

  /* 产物文档样式预览（克制风格，不当真生成完整内容，给老师"看到 AI 写的东西"的感觉） */
  function _renderArtifactPreviewHTML(name, ext){
    // 不同产物类型给不同 mock 内容（按 name 做轻量识别）
    const isLessonPlan = /教学设计|教案|复习课/.test(name);
    const isExercise = /练习|变式|题/.test(name);
    const isReview = /讲评|要点|分析/.test(name);

    if(isLessonPlan){
      return `
        <article class="art-doc-preview">
          <h1>${name}</h1>
          <p class="art-doc-sub">课时 40 分钟 · 八(3)班 · 二次函数复习</p>
          <h2>一、教学目标</h2>
          <ol><li>能根据 a / b / c 三个系数判断二次函数图像特征</li><li>能从图像反推系数符号</li><li>突破学生易错的"对称轴位置判断"</li></ol>
          <h2>二、教学环节</h2>
          <h3>环节 1 · 导入（5 分钟）</h3>
          <p>用 11 月真题第 18 题（你班错率 47%）切入，让学生回顾"系数怎么影响图像"。</p>
          <h3>环节 2 · 精讲（20 分钟）</h3>
          <p>...（共 3 个环节，预览仅展示部分）</p>
          <p class="art-doc-tail">— 共 1200 字 · AI 已基于你的备课资料生成 —</p>
        </article>
      `;
    }
    if(isExercise){
      return `
        <article class="art-doc-preview">
          <h1>${name}</h1>
          <p class="art-doc-sub">10 道选择题 · 含答案与解析 · 难度参考你的 2024 真题</p>
          <h2>第 1 题 【基础】</h2>
          <p>已知二次函数 y = ax² + bx + c（a ≠ 0）的图像开口向上，且经过原点，则下列判断正确的是（&nbsp;&nbsp;&nbsp;&nbsp;）</p>
          <p>A. a &gt; 0, c = 0 &nbsp;&nbsp; B. a &lt; 0, c = 0 &nbsp;&nbsp; C. a &gt; 0, c &gt; 0 &nbsp;&nbsp; D. a &lt; 0, c &lt; 0</p>
          <p style="color:#888;font-size:13px;margin-top:6px">答案：A &nbsp;|&nbsp; 考点：a 决定开口 / c 是 y 轴截距 &nbsp;|&nbsp; 易错：选 C（误以为开口向上 c 一定大于 0）</p>
          <h2>第 2 题 【基础】</h2>
          <p>...（共 10 题，预览仅展示前 1 题）</p>
          <p class="art-doc-tail">— 共 600 字 · AI 已参照你的真题难度生成 —</p>
        </article>
      `;
    }
    if(isReview){
      return `
        <article class="art-doc-preview">
          <h1>${name}</h1>
          <p class="art-doc-sub">基于八(3)班月考错题分布生成 · 错率最高 62%</p>
          <h2>错因 1 · 添加辅助线无方向</h2>
          <p>典型错例：第 18 题，60% 学生不知道"延长 AD 到 E"。讲评时建议用"边相等 → 倍长中线 / 截长补短"两个标准动作切入。</p>
          <h2>错因 2 · 全等条件混用</h2>
          <p>...（共 4 大错因，预览仅展示部分）</p>
          <p class="art-doc-tail">— 共 1500 字 · AI 已分析你班 28 份作业 —</p>
        </article>
      `;
    }
    // 兜底
    return `
      <article class="art-doc-preview">
        <h1>${name}</h1>
        <p class="art-doc-sub">AI 生成的产物文档</p>
        <p>预览内容（demo 占位）...</p>
      </article>
    `;
  }

  /* 内部 helper：只清"在回顾对话"的状态（右栏恢复主对话 / 副标题恢复 / 高亮清除）
     不动中栏 state — 调用者负责后续中栏状态 */
  function _resetChatHistoryView(){
    const stream = document.getElementById('chat-stream');
    if(stream && mainChatStreamHTML !== null){
      stream.innerHTML = mainChatStreamHTML;
      mainChatStreamHTML = null;
    }
    currentChatTitle = '';
    const sub = document.getElementById('chat-context-subtitle');
    if(sub) sub.textContent = '需要时叫我';
    document.querySelectorAll('#recent-chat-list .tree-row.active').forEach(el => el.classList.remove('active'));
    // 新用户场景下，回退后右栏要重新加上 empty 类（让 mock 内容继续被隐藏，empty-hint 显示）
    if(sidebarLeftEmpty()){
      const sbR = document.getElementById('sidebar-right');
      if(sbR) sbR.classList.add('empty');
    }
    if(window.lucide) lucide.createIcons();
  }

  /* 退出历史回顾，完整恢复主对话 + 中栏回 default（顶部「+」按钮触发） */
  function exitRecentChat(){
    _resetChatHistoryView();
    setLayoutMode('default');
    setState(sidebarLeftEmpty()?'empty':'default');
  }

  /* 点对话气泡里的产物卡片：中栏打开此产物文件（保留右栏对话历史）
     stateName: 'source'（普通产物）或 'welcome-doc'（入门指南专属预览） */
  function openArtifactInCenter(name, ext, stateName){
    _openArtifactInCenterPreservingHistory(name, ext, stateName || 'source');
    showToast('✓ 已打开预览：' + name);
  }

  /* "继续此对话"按钮 — 切回 default 模式但保留对话历史 */
  function continueRecentChat(){
    setLayoutMode('default');
    if(typeof focusChatInput === 'function') focusChatInput();
  }

  // 点「我的知识库」标题：空态回首页，有内容回默认态（最近素材主页）
  function navToKnowledgeBase(){
    if(sidebarLeftEmpty()){
      setState('empty');
    }else{
      setState('default');
    }
  }

  // 点「我的题库」/ 学科行 → 进入题库
  // 空态用户进入 = qbank-empty（与知识库空态对称）
  // 有内容用户 = qbank（含 73 题示例）
  function navToQBank(subject){
    if(sidebarLeftEmpty() && !subject){
      setState('qbank-empty');
      return;
    }
    setState('qbank');
    if(subject){
      setQbkSubject(subject);
    }
  }

  // 空态：让老师把焦点放到右栏 AI 对话输入框
  function focusChatInput(){
    const sb = document.getElementById('sidebar-right');
    if(sb && sb.classList.contains('collapsed')){
      toggleSidebar('right');
    }
    setTimeout(()=>{
      const input = document.getElementById('chat-input');
      if(input) input.focus();
    }, 60);
  }

  // v3.5 新增：「跟 AI 聊聊」专用入口
  // 区别于 focusChatInput（只 focus 输入框）：
  //   ① 进 focus-chat 模式（中栏让位，对话占主场，跟豆包/ChatGPT 心智一致）
  //   ② AI 自动开场（一条欢迎语，但严格不暗示"先上传资料"，守 §3.2 红线）
  //   ③ focus 输入框
  // 设计原则：老师选了"先聊聊"= 选择不上传，飞象不卖资料、不暗示、不引导。
  //          PLG 由"AI 答得不够准"自然驱动老师自己想"我得传点资料给它"，不靠产品话术。
  // v3.5：「跟 AI 聊聊」改 Gemini 风格
  // 改造意图：
  //   ① AI 不主动开场（守 §3.2"AI 不主动" — 之前注入 AI 开场消息违反此条）
  //   ② 改为静态欢迎页 + 4 张快捷卡片（用户认知零成本，对齐 Gemini / ChatGPT new chat）
  //   ③ 老师点卡片 → prompt 塞进输入框 + 欢迎页淡出；老师开始输入 → 欢迎页淡出
  //   ④ 摘掉左栏 active 状态（不属于任何一条历史对话，是"新建对话"模式）
  function enterChatOnlyMode(){
    // ① 进 focus-chat 布局（中栏隐藏，对话区铺满中+右）
    setLayoutMode('focus-chat');

    // ② 摘掉右栏 empty 类 + 挂 has-zen-welcome 标志位（CSS 据此隐藏底部原 chat-composer）
    const sbR = document.getElementById('sidebar-right');
    if(sbR){
      sbR.classList.remove('empty');
      sbR.classList.add('has-zen-welcome');
    }

    // ③ 顶部副标题
    const sub = document.getElementById('chat-context-subtitle');
    if(sub) sub.textContent = '新对话';

    // ④ 在 chat-stream 注入 Gemini 风格欢迎页：hero + composer 卡片（textarea / chip / foot 三层）
    //    composer 卡片自带 textarea + 发送按钮 — 真正取代底部原 chat-composer 的角色
    //    参照 demo/v22-home-options/N1-plus.html
    const stream = document.getElementById('chat-stream');
    if(stream && !stream.querySelector('[data-zen-welcome]')){
      stream.querySelectorAll('.empty-hint, .stream-day, .stream-msg').forEach(el=>el.remove());
      stream.insertAdjacentHTML('beforeend', `
        <div class="zen-chat-welcome" data-zen-welcome>
          <div class="zcw-hero">
            <div class="zcw-brand">
              <span class="zcw-brand-dot">飞</span>
              <span class="zcw-brand-name">飞象 AI</span>
              <span class="zcw-brand-sep">·</span>
              <span>老师的 AI 助手</span>
            </div>
            <h1 class="zcw-greet">下午好，张老师</h1>
          </div>

          <!-- 竖排建议 pill（仅侧栏模式显示，对齐 Gemini for Chrome 侧栏范式）-->
          <div class="zcw-suggestions">
            <button class="zcw-pill" onclick="zcwUseChip('想出什么样的题？比如：高一议论文 10 道选择 + 2 道作文，难度中等')">
              <i data-lucide="sparkles"></i>AI 组题：帮我按知识点出练习题
            </button>
            <button class="zcw-pill" onclick="zcwUseChip('要做哪个知识点的动画？比如：勾股定理推导，2 分钟，配旁白')">
              <i data-lucide="play"></i>教学动画：把知识点做成课堂动画
            </button>
            <button class="zcw-pill" onclick="zcwUseChip('为哪节课做课件？比如：《二次函数图像与性质》第二课时，重点讲对称轴')">
              <i data-lucide="layout"></i>多页课件：给这节课出完整课件
            </button>
            <button class="zcw-pill zcw-pill-more" onclick="enterChatOnlyMode()">
              <i data-lucide="more-horizontal"></i>更多工具…
            </button>
          </div>

          <div class="zcw-composer">
            <textarea id="zcw-input" rows="2"
              placeholder="想做什么？比如：把昨天扫的高一(3)班作文按错因分类整理一下"></textarea>

            <!-- chip 行：4 个核心生成工具 + …更多 -->
            <div class="zcw-chips">
              <button class="zcw-chip" onclick="zcwUseChip('想出什么样的题？比如：高一议论文 10 道选择 + 2 道作文，难度中等')" title="AI 帮你按知识点 / 难度 / 题型组卷">
                <i data-lucide="sparkles"></i>AI 组题
              </button>
              <button class="zcw-chip" onclick="zcwUseChip('要做哪个知识点的动画？比如：勾股定理推导，2 分钟，配旁白')" title="生成可在课堂上播放的教学动画">
                <i data-lucide="play"></i>教学动画
              </button>
              <button class="zcw-chip" onclick="zcwUseChip('要做什么游戏？比如：成语接龙，4 人小组，10 分钟课堂活动')" title="生成课堂互动小游戏">
                <i data-lucide="gamepad-2"></i>教学游戏
              </button>
              <button class="zcw-chip" onclick="zcwUseChip('为哪节课做课件？比如：《二次函数图像与性质》第二课时，重点讲对称轴')" title="生成可分页讲授的多页课件">
                <i data-lucide="layout"></i>多页课件
              </button>
              <button class="zcw-chip more" onclick="showToast('更多工具规划中：教案、学情分析、AI 翻译润色…')" title="更多能力">
                <i data-lucide="more-horizontal"></i>
              </button>
            </div>

            <!-- foot 行：左 附件/语音/知识库 ｜ 右 发送 -->
            <div class="zcw-foot-row">
              <div class="zcw-foot-left">
                <button class="zcw-icon-btn" title="上传附件" onclick="openUploadWindow()">
                  <i data-lucide="paperclip"></i>
                </button>
                <button class="zcw-icon-btn" title="语音输入（敬请期待）" onclick="showToast('语音输入开发中…')">
                  <i data-lucide="mic"></i>
                </button>
                <span class="zcw-divider"></span>
                <button class="zcw-kb-attach" title="选择知识库范围（默认：我的知识库 全部）" onclick="showToast('当前范围：我的知识库 · 默认全部')">
                  <i data-lucide="book-open"></i>知识库
                </button>
              </div>
              <button class="zcw-send" onclick="zcwSend()" title="发送（Enter）">
                <i data-lucide="arrow-up"></i>
              </button>
            </div>
          </div>

          <div class="zcw-foot">
            <i data-lucide="lock"></i>
            <span>对话只属于你 · 不进通用模型</span>
          </div>
        </div>
      `);
      if(window.lucide) lucide.createIcons();
    }

    // ⑤ focus 欢迎页内 textarea + Enter 发送
    setTimeout(()=>{
      const ta = document.getElementById('zcw-input');
      if(!ta) return;
      ta.focus();
      ta.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter' && !e.shiftKey){
          e.preventDefault();
          zcwSend();
        }
      });
    }, 80);
  }

  // 欢迎页 chip 点击：
  //   focus-chat（全宽）→ 填入嵌入式 zcw-input（不直接发送，让老师补细节）
  //   窄侧栏（非 focus-chat）→ 回退到底部 composer-text，符合"输入框钉底部"范式
  function zcwUseChip(text){
    const ta = document.getElementById('zcw-input') || document.getElementById('composer-text');
    if(!ta) return;
    ta.value = text;
    ta.focus();
    if(ta.setSelectionRange) ta.setSelectionRange(ta.value.length, ta.value.length);
  }

  // 欢迎页发送：值塞回真正的 composer-text → 淡出欢迎页 → 卸 has-zen-welcome → 走原 sendChatMessage
  function zcwSend(){
    const ta = document.getElementById('zcw-input');
    if(!ta) return;
    const text = (ta.value || '').trim();
    if(!text){
      // 空提交也允许（兜底走 sendChatMessage 的 demo 问题）
    } else {
      const real = document.getElementById('composer-text');
      if(real) real.value = text;
    }
    const w = document.querySelector('[data-zen-welcome]');
    const sbR = document.getElementById('sidebar-right');
    const cleanup = ()=>{
      if(sbR) sbR.classList.remove('has-zen-welcome');
      if(typeof sendChatMessage === 'function') sendChatMessage();
    };
    if(w){
      w.style.transition = 'opacity .2s';
      w.style.opacity = '0';
      setTimeout(()=>{ w.remove(); cleanup(); }, 210);
    } else {
      cleanup();
    }
  }

  // 旧 useQuickPrompt 保留为兼容（可能其他地方还在调）：行为退化为塞 composer-text + 淡出欢迎页
  function useQuickPrompt(text){
    const input = document.getElementById('composer-text');
    if(!input) return;
    input.value = text;
    input.focus();
    input.dispatchEvent(new Event('input', {bubbles:true}));
    // composer-hints 常驻，不隐藏
  }

  // 入门指南内的"试试这些示例问题" — 把问题塞到右栏输入框 + focus
  // 设计意图：让老师即时体验 AI 能力（点卡片就能问），把"看说明书" → "动手试"
  function tryExampleQuestion(q){
    // 切到日常工作台（这样右栏 AI 才有上下文可用）
    if(sidebarLeftEmpty()){
      // 新用户：先帮 ta 加载示范素材
      setState('default');
      if(typeof loadDemoData === 'function') loadDemoData();
    }else{
      setState('default');
    }
    // 等 sidebar 切换动效完成再 focus
    setTimeout(()=>{
      const sb = document.getElementById('sidebar-right');
      if(sb && sb.classList.contains('collapsed')){
        toggleSidebar('right');
      }
      const input = document.getElementById('composer-text') || document.getElementById('chat-input');
      if(input){
        input.value = q;
        input.focus();
        // 把光标放到末尾
        if(input.setSelectionRange){
          input.setSelectionRange(q.length, q.length);
        }
      }
      showToast('💬 已为你填好问题，按 Enter 发送');
    }, 120);
  }

  // 兼容左侧「题目」学科入口：不在题目页顶部展示学科 tab，只同步内容区域
  function setQbkSubject(subject){
    // 切换两个 side pane 内的子学科 pane
    document.querySelectorAll('.qbk-side-subj').forEach(p=>{
      p.classList.toggle('active', p.dataset.subjPane===subject);
    });
    // 更新右侧 list-meta 当前路径
    const map = {math:'数学', cn:'语文', en:'英语'};
    const meta = document.querySelector('.qbk-list-meta > span');
    if(meta){
      const firstActive = document.querySelector('.qbk-side-subj.active .qbk-side-row.active span');
      const kp = firstActive ? firstActive.textContent : '';
      const cnts = {math:12, cn:7, en:5};
      meta.innerHTML = '当前：<b>' + (map[subject]||'') + (kp?' › '+kp:'') + '</b> · 共 ' + (cnts[subject]||0) + ' 题';
    }
    if(window.lucide) lucide.createIcons();
  }

  function switchQbkSubject(tab, subject){
    setQbkSubject(subject);
  }

  // 题库左栏 tab 切换（知识点 / 教材章节）
  function switchQbkSide(tab, pane){
    tab.parentElement.querySelectorAll('.qbk-side-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.qbk-side-pane').forEach(p=>{
      p.classList.toggle('active', p.dataset.pane===pane);
    });
    if(window.lucide) lucide.createIcons();
  }

  // 题目添加到题目篮（toggle）
  function toggleQitemAdd(btn){
    const item = btn.closest('.qitem');
    const added = btn.classList.toggle('added');
    item.classList.toggle('added', added);
    btn.innerHTML = added
      ? '已加入'
      : '<i data-lucide="plus"></i>添加';
    if(window.lucide) lucide.createIcons();
    syncQbasketState();
  }

  // 同步底部计数 + 下载按钮可用状态 + 题目篮面板内容
  function syncQbasketState(){
    const items = document.querySelectorAll('.qitem.added');
    const cnt = items.length;
    const elCount = document.getElementById('qbk-basket-count');
    if(elCount) elCount.textContent = cnt;
    // v3.6 P0-2：0 选时把整条底栏折叠为右下角浮窗
    const basket = document.querySelector('.qbk-basket');
    if(basket) basket.classList.toggle('empty', cnt === 0);
    // 下载按钮 disabled
    const dl = document.getElementById('qbk-basket-download');
    if(dl){
      dl.classList.toggle('disabled', cnt===0);
      dl.onclick = cnt===0 ? null : ()=> showToast('（演示）下载已选 ' + cnt + ' 题');
    }
    // 题目篮面板渲染
    const list = document.getElementById('qbasket-list');
    const empty = document.getElementById('qbasket-empty');
    const foot = document.getElementById('qbasket-foot');
    const cntBadge = document.getElementById('qbasket-cnt');
    if(cntBadge) cntBadge.textContent = cnt;
    if(!list || !empty || !foot) return;
    // 移除老的题目项
    list.querySelectorAll('.qbasket-item').forEach(n=>n.remove());
    if(cnt===0){
      empty.style.display = 'flex';
      foot.style.display = 'none';
    }else{
      empty.style.display = 'none';
      foot.style.display = 'flex';
      items.forEach((item, idx)=>{
        const stem = item.querySelector('.qitem-stem')?.textContent.trim() || '';
        const tags = Array.from(item.querySelectorAll('.qitem-tag'))
          .slice(0, 3)
          .map(t=> '<span class="qbi-tag">'+ t.textContent.trim() +'</span>')
          .join('');
        const div = document.createElement('div');
        div.className = 'qbasket-item';
        div.innerHTML = `
          <span class="qbi-no">#${String(idx+1).padStart(2,'0')}</span>
          <div class="qbi-body">
            <div class="qbi-stem">${stem}</div>
            <div class="qbi-meta">${tags}</div>
          </div>
          <button class="qbi-remove" data-target-idx="${Array.from(document.querySelectorAll('.qitem')).indexOf(item)}">
            <i data-lucide="x"></i>
          </button>
        `;
        list.appendChild(div);
      });
      // 绑定移除事件
      list.querySelectorAll('.qbi-remove').forEach(btn=>{
        btn.onclick = ()=>{
          const targetIdx = parseInt(btn.dataset.targetIdx);
          const allItems = document.querySelectorAll('.qitem');
          const target = allItems[targetIdx];
          if(target){
            const addBtn = target.querySelector('.qitem-add');
            if(addBtn) toggleQitemAdd(addBtn);
          }
        };
      });
      if(window.lucide) lucide.createIcons();
    }
  }

  function openQbasketPanel(){
    document.getElementById('qbasket-overlay').classList.add('show');
    document.getElementById('qbasket-panel').classList.add('show');
    syncQbasketState();
    if(window.lucide) lucide.createIcons();
  }
  function closeQbasketPanel(){
    document.getElementById('qbasket-overlay').classList.remove('show');
    document.getElementById('qbasket-panel').classList.remove('show');
  }
  function clearQbasket(){
    document.querySelectorAll('.qitem.added').forEach(item=>{
      const addBtn = item.querySelector('.qitem-add');
      if(addBtn) toggleQitemAdd(addBtn);
    });
    showToast('已清空题目篮');
  }

  // 当前左栏是否处于"新用户空状态"（用于 welcome 返回时决定回到 empty 还是 default）
  function sidebarLeftEmpty(){
    return document.getElementById('sidebar-left').classList.contains('empty');
  }

  function openSource(name){
    // v3.3+: 从左栏点击文件 → 老师明确"换上下文"，主动清掉对话历史（用 _resetChatHistoryView 不 flash 中栏）
    if(mainChatStreamHTML !== null){
      _resetChatHistoryView();
    }
    // 入门指南走独立的 welcome 态（内容是 md-like 文档，不是 PPT 预览）
    if(name === '飞象 AI · 入门指南'){
      setState('welcome');
      return;
    }
    // 对话产物走对话预览态（v2 兼容旧"草稿 ·"前缀）
    if(name && (name.startsWith('对话 ·') || name.startsWith('对话·')
                || name.startsWith('草稿 ·') || name.startsWith('草稿·'))){
      openDraftSource(name);
      return;
    }
    setState('source');
    // 恢复 state-source 为原始知识库文件预览样式（清掉之前 _openArtifactInCenterPreservingHistory 注入的产物状态）
    _restoreOriginalSourceLayout(name);
    if(name){
      document.getElementById('composer-context-name').textContent = name;
    }
  }

  /* v3.5 二轮：从题库题目卡片跳源文件预览
     设计意图：强化"题来自文件"派生关系
       ① 跳转 + toast 显式说"题来自这个文件 / 文件在知识库里"
       ② 这是"题库 → 知识库"的反向链接，加深心智
     实施：复用 openSource()，但加 toast 强化心智锚点 */
  function openSourceFromQbank(name){
    openSource(name);
    setTimeout(()=>{
      showToast('📄 已打开原文件 · 题目就是 AI 从这份文件抽出的');
    }, 220);
  }

  /* 把 state-source 恢复成"原始知识库文件预览"样式（PPT 翻页 + 标准面包屑 + 标准 meta + 标准动作） */
  function _restoreOriginalSourceLayout(name){
    const fname = name || '二次函数图像与性质 · 导入课件';

    // 面包屑
    const breadcrumb = document.querySelector('.state-source .src-breadcrumb');
    if(breadcrumb){
      breadcrumb.innerHTML = `
        <span class="src-bc-item" onclick="navToKnowledgeBase()">我的知识库</span>
        <i data-lucide="chevron-right" class="src-bc-sep"></i>
        <span class="src-bc-item" onclick="setState('default')">数学</span>
        <i data-lucide="chevron-right" class="src-bc-sep"></i>
        <span class="src-bc-item" onclick="setState('default')">八下·二次函数</span>
        <i data-lucide="chevron-right" class="src-bc-sep"></i>
        <span class="src-bc-item current">${fname}.pptx</span>
      `;
    }

    // 文件头只保留标题
    const titleEl = document.querySelector('.source-head-title');
    if(titleEl) titleEl.textContent = fname;

    // 预览区 — 恢复原始 PPT 翻页预览
    const preview = document.querySelector('.state-source .source-preview');
    if(preview){
      preview.innerHTML = _ORIGINAL_SOURCE_PREVIEW_HTML;
    }

    if(window.lucide) lucide.createIcons();
  }

  /* 缓存原始 source 预览 HTML（首次访问时锁定，后续恢复用） */
  let _ORIGINAL_SOURCE_PREVIEW_HTML = '';
  document.addEventListener('DOMContentLoaded', function(){
    const orig = document.querySelector('.state-source .source-preview');
    if(orig) _ORIGINAL_SOURCE_PREVIEW_HTML = orig.innerHTML;
  });

  // 对话产物预览：复用 state-source 布局，文件头只保留标题
  // （v2 函数名保留 openDraftSource，避免影响其它引用；语义已变为"对话产物预览"）
  function openDraftSource(name){
    setState('source');
    if(name) document.getElementById('composer-context-name').textContent = name;
    const titleEl = document.querySelector('.source-head-title');
    if(titleEl && name) titleEl.textContent = name.replace('对话 · ','').replace('对话·','').replace('草稿 · ','').replace('草稿·','');
  }

  // 老师点上下文标签上的 × 按钮：临时取消「绑定当前素材」，让 AI 基于全部素材回答
  // 不影响中栏的素材预览，老师还在看 PPT，但下一个问题会换到全局上下文
  function clearChatContext(){
    const ctx = document.getElementById('composer-context');
    if(ctx) ctx.style.display = 'none';
    const sub = document.getElementById('chat-context-subtitle');
    if(sub) sub.textContent = '已切回全库 · 基于所有文件回答';
    showToast('已不基于当前文件回答');
  }

  // 「先用示范素材试试」直接跳过 onboarding 进默认态
  function loadDemoData(){
    document.getElementById('sidebar-left').classList.remove('empty');
    setState('default');
    showToast('✓ 已为你准备 28 份示范素材');
  }

  // ============ Onboarding 进度动画（融合自原 onboarding.html） ============
  let obProgressTimer = null;
  // ============ 渐进可用的导入流程 ============
  // 设计哲学：最快的部分（文件读取，~5 秒）完成 → 老师立刻进入工作台
  // 慢的部分（AI 打标签 / 抽摘要 / 建关联，需要分钟级）→ 后台徽章异步跑
  // 老师不用等
  function startImport(){
    setState('onboarding-progress');
    runStage1Progress();
  }
  function runStage1Progress(){
    let pct = 0;
    const bar = document.getElementById('ob-bar');
    const pctEl = document.getElementById('ob-pct');
    const etaEl = document.getElementById('ob-eta');
    const t1 = document.getElementById('ob-task-1');
    const t1d = document.getElementById('ob-task-1-detail');

    if(obProgressTimer) clearInterval(obProgressTimer);

    // 5 秒跑完：让老师感受到"读取很快"
    obProgressTimer = setInterval(()=>{
      pct += 4;
      if(pct > 100) pct = 100;
      bar.style.width = pct + '%';
      pctEl.textContent = pct;

      const cnt = Math.round((pct/100) * 247);
      if(t1d) t1d.textContent = `已读取 ${cnt} / 247 个文件…`;
      const remain = Math.max(0, Math.round((100-pct)*0.05));
      if(etaEl) etaEl.textContent = remain > 0 ? `${remain} 秒` : '即将完成';

      if(pct >= 100){
        clearInterval(obProgressTimer);
        markObDone(t1, '247 个文件');
        if(t1d) t1d.textContent = '247 / 247 个文件 · 原结构已保留';
        if(etaEl) etaEl.textContent = '完成';
        // 阶段 1 完成 → 0.6 秒后跳工作台，启动后台徽章
        setTimeout(finishStage1AndStartBg, 600);
      }
      if(window.lucide) lucide.createIcons();
    }, 60);
  }
  function markObDone(el, meta){
    if(!el) return;
    el.classList.remove('doing','pending');
    el.classList.add('done');
    const statusEl = el.querySelector('.ob-step-status');
    if(statusEl) statusEl.innerHTML = '<i data-lucide="check"></i>';
    const metaEl = el.querySelector('.ob-step-meta');
    if(metaEl) metaEl.textContent = '✓ ' + meta;
  }
  function startObTask(el, detail){
    if(!el) return;
    el.classList.remove('pending');
    el.classList.add('doing');
    const statusEl = el.querySelector('.ob-step-status');
    if(statusEl) statusEl.innerHTML = '<i data-lucide="loader"></i>';
    const metaEl = el.querySelector('.ob-step-meta');
    if(metaEl) metaEl.textContent = '进行中';
    if(detail){
      const detailEl = el.querySelector('.ob-step-detail');
      if(detailEl) detailEl.textContent = detail;
    }
  }
  // 阶段 1 完成 → 进入工作台；后续异步任务统一进通知中心
  function finishStage1AndStartBg(){
    document.getElementById('sidebar-left').classList.remove('empty');
    setState('default');
    // 显示导入完成总览（一次性）
    const banner = document.getElementById('post-import-banner');
    if(banner) banner.style.display = 'flex';
    startBgTask();
    showToast('✓ 247 份素材已就位 · 你可以开始用了，后续进度看右上角通知');
  }
  // 旧的 finishOnboarding 兼容（防止万一被调用）
  function finishOnboarding(){
    finishStage1AndStartBg();
  }

  // ============ 后台任务状态：统一收敛到通知中心 ============
  let bgTimer = null;
  let bgPct = 0;
  function startBgTask(){
    const badge = document.getElementById('bg-task');
    if(badge) badge.style.display = 'none';
    startNotifProgressDemo();
    return;
    bgPct = 0;
    updateBgRing(0);
    document.getElementById('bg-task-pct').textContent = '0';

    if(bgTimer) clearInterval(bgTimer);

    // 30 秒走完阶段 2-4（demo 节奏；真实产品里会是 5-15 分钟）
    bgTimer = setInterval(()=>{
      bgPct += 0.6;
      if(bgPct > 100) bgPct = 100;
      updateBgRing(bgPct);
      document.getElementById('bg-task-pct').textContent = Math.round(bgPct);

      // 阶段 2（0-40%）：打标签
      if(bgPct < 40){
        const tags = Math.round((bgPct/40)*38);
        const el2 = document.getElementById('bgp-task-2-detail');
        if(el2) el2.textContent = `已识别 ${tags} 个标签…`;
      }
      if(bgPct >= 40 && !document.getElementById('bgp-task-2').classList.contains('done')){
        markBgDone('bgp-task-2', '38 个标签');
        startBgItem('bgp-task-3', '正在抽取目录、做 OCR…');
      }
      // 阶段 3（40-80%）：抽摘要
      if(bgPct > 40 && bgPct < 80){
        const sums = Math.round(((bgPct-40)/40)*189);
        const el3 = document.getElementById('bgp-task-3').querySelector('span');
        if(el3) el3.textContent = `已生成 ${sums} 份摘要…`;
      }
      if(bgPct >= 80 && !document.getElementById('bgp-task-3').classList.contains('done')){
        markBgDone('bgp-task-3', '189 份摘要');
        startBgItem('bgp-task-4', '正在建立文件关联…');
      }
      // 阶段 4（80-100%）：建关联
      if(bgPct >= 100){
        markBgDone('bgp-task-4', '14 个知识点的关联图谱已就绪');
        clearInterval(bgTimer);
        // 徽章变绿
        if(badge){
          badge.classList.add('done');
          document.getElementById('bg-task-pct').textContent = '';
          const labelEl = badge.querySelector('.bg-task-label');
          if(labelEl) labelEl.textContent = 'AI 已激活';
        }
        setTimeout(()=>{
          showToast('✓ AI 已为你激活全部素材 · 现在可以问任何问题');
          // 5 秒后徽章悄悄淡出
          setTimeout(()=>{
            if(!badge) return;
            badge.style.transition = 'opacity .5s ease, transform .5s ease';
            badge.style.opacity = '0';
            badge.style.transform = 'scale(.85)';
            setTimeout(()=>{
              badge.style.display = 'none';
              badge.style.opacity = '';
              badge.style.transform = '';
              badge.style.transition = '';
            }, 500);
          }, 4500);
        }, 400);
      }
    }, 100);
  }
  function updateBgRing(pct){
    // 圆周长 = 2π * 15.5 ≈ 97.4
    const offset = 97.4 * (1 - pct/100);
    const ring = document.getElementById('bg-task-ring-fill');
    if(ring) ring.setAttribute('stroke-dashoffset', offset);
  }
  function markBgDone(id, meta){
    const el = document.getElementById(id);
    if(!el) return;
    el.classList.remove('doing','pending');
    el.classList.add('done');
    const status = el.querySelector('.bgp-status');
    if(status) status.innerHTML = '<i data-lucide="check"></i>';
    const span = el.querySelector('span');
    if(span) span.textContent = '✓ ' + meta;
    if(window.lucide) lucide.createIcons();
  }
  function startBgItem(id, detail){
    const el = document.getElementById(id);
    if(!el) return;
    el.classList.remove('pending');
    el.classList.add('doing');
    const status = el.querySelector('.bgp-status');
    if(status) status.innerHTML = '<i data-lucide="loader"></i>';
    const span = el.querySelector('span');
    if(span && detail) span.textContent = detail;
    if(window.lucide) lucide.createIcons();
  }
  function toggleBgTaskPanel(){
    const panel = document.getElementById('bg-task-panel');
    if(!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if(window.lucide) lucide.createIcons();
  }
  // 点其他地方关闭面板
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('#bg-task') && !e.target.closest('#bg-task-panel')){
      const panel = document.getElementById('bg-task-panel');
      if(panel && panel.style.display !== 'none') panel.style.display = 'none';
    }
  });

  // ============ 新用户拖拽上传（兼容文件 / 多文件 / 文件夹 / 压缩包） ============
  let zenDragCounter = 0;
  function zenDragEnter(e){
    e.preventDefault();
    zenDragCounter++;
    document.getElementById('zen-dropzone').classList.add('dragging');
  }
  function zenDragLeave(e){
    e.preventDefault();
    zenDragCounter--;
    if(zenDragCounter <= 0){
      zenDragCounter = 0;
      document.getElementById('zen-dropzone').classList.remove('dragging');
    }
  }
  function zenDrop(e){
    e.preventDefault();
    zenDragCounter = 0;
    document.getElementById('zen-dropzone').classList.remove('dragging');

    // 识别拖入内容：文件 / 多文件 / 文件夹 / 压缩包
    const items = e.dataTransfer ? e.dataTransfer.items : null;
    const files = e.dataTransfer ? e.dataTransfer.files : null;
    let summary = '';
    let hasFolder = false;
    let hasZip = false;
    let fileCount = 0;

    if(items && items.length){
      for(let i = 0; i < items.length; i++){
        const it = items[i];
        if(it.kind !== 'file') continue;
        const entry = it.webkitGetAsEntry ? it.webkitGetAsEntry() : null;
        if(entry && entry.isDirectory){
          hasFolder = true;
        }else{
          fileCount++;
          const f = it.getAsFile && it.getAsFile();
          if(f && /\.(zip|rar|7z|tar|gz)$/i.test(f.name)) hasZip = true;
        }
      }
    }else if(files){
      fileCount = files.length;
      for(let i = 0; i < files.length; i++){
        if(/\.(zip|rar|7z|tar|gz)$/i.test(files[i].name)) hasZip = true;
      }
    }

    if(hasFolder){
      summary = '✓ 检测到文件夹 · 准备扫描结构…';
    }else if(hasZip){
      summary = '✓ 检测到压缩包 · 准备解压扫描…';
    }else if(fileCount > 1){
      summary = `✓ 检测到 ${fileCount} 个文件 · 准备添加…`;
    }else if(fileCount === 1){
      summary = '✓ 检测到 1 个文件 · 准备添加…';
    }else{
      summary = '✓ 准备处理…';
    }

    showToast(summary);
    setTimeout(()=>setState('onboarding-scan'), 500);
  }
  // 阻止默认行为：拖到页面其他地方不要打开文件
  ['dragover','drop'].forEach(evt=>{
    window.addEventListener(evt, e=>{
      if(!e.target.closest('#zen-dropzone')) e.preventDefault();
    });
  });

  // ============ 右键菜单 ============
  let ctxTarget = null;
  let ctxTargetType = 'folder';
  function showCtxMenu(e, type, target){
    e.preventDefault();
    e.stopPropagation();
    const menu = document.getElementById('ctx-menu');
    menu.querySelectorAll('.ctx-menu-list').forEach(el=>{
      el.classList.toggle('active', el.dataset.menu === type);
    });
    const header = document.getElementById('ctx-header');
    if(type === 'blank'){
      header.style.display = 'none';
    }else{
      header.style.display = 'block';
      const name = target?.querySelector('.tree-label')?.textContent?.trim() || '当前项';
      header.textContent = (type === 'folder' ? '📁 ' : '📄 ') + name;
    }
    menu.style.display = 'block';
    // 等渲染后测真实尺寸再定位
    requestAnimationFrame(()=>{
      const r = menu.getBoundingClientRect();
      let x = e.clientX, y = e.clientY;
      if(x + r.width > window.innerWidth - 8) x = window.innerWidth - r.width - 8;
      if(y + r.height > window.innerHeight - 8) y = window.innerHeight - r.height - 8;
      menu.style.left = x + 'px';
      menu.style.top = y + 'px';
    });
    ctxTarget = target;
    ctxTargetType = type;
    if(window.lucide) lucide.createIcons();
  }
  function hideCtxMenu(){
    document.getElementById('ctx-menu').style.display = 'none';
  }
  function ctxAction(action){
    const target = ctxTarget;
    const type = ctxTargetType;
    hideCtxMenu();
    const name = target?.querySelector('.tree-label')?.textContent?.trim() || '当前项';
    switch(action){
      case 'newFolder':
        createNewFolder();
        break;
      case 'newNote':
        const noteName = prompt('笔记名', '新笔记');
        if(noteName) showToast(`✓ 已创建笔记「${noteName}」（演示）`);
        break;
      // v3.5 入口收敛：右键「导入到这里」UI 已删，case 顺手清理
      case 'rename': {
        const newName = prompt('新名称', name);
        if(newName && target){
          const labelEl = target.querySelector('.tree-label');
          if(labelEl){
            // 保留可能的 .file-ext span
            const ext = labelEl.querySelector('.file-ext');
            labelEl.textContent = newName;
            if(ext) labelEl.appendChild(ext);
          }
          showToast(`✓ 已重命名为「${newName}」`);
        }
        break;
      }
      case 'delete':
        if(confirm(`确定删除「${name}」？AI 索引会同步清空。`)){
          if(target){
            const isFolder = type === 'folder';
            const node = isFolder ? target.closest('.tree-group') : target;
            if(node && node.parentNode) node.parentNode.removeChild(node);
          }
          showToast(`✓ 已删除「${name}」`);
        }
        break;
      case 'copyPath':
        const path = '/我的知识库/' + name;
        if(navigator.clipboard) navigator.clipboard.writeText(path).catch(()=>{});
        showToast(`✓ 已复制路径：${path}`);
        break;
      case 'open':
        if(target) openSource(name);
        break;
      case 'askAi':
        openSource(name);
        showToast(`✓ AI 已锁定「${name}」作为上下文`);
        break;
      case 'move':
        showToast('→ 选择目标文件夹（演示版本暂不实现弹窗）');
        break;
      case 'graph':
        openGraphDemo();
        break;
      case 'collapseAll':
        document.querySelectorAll('.tree-group.open').forEach(g=>g.classList.remove('open'));
        showToast('✓ 已折叠所有文件夹');
        break;
      case 'refresh':
        showToast('✓ 已刷新');
        break;
    }
  }
  // 判断该 tree-row 是否支持上下文菜单（folder/file 操作）
  // 不支持的：底部 nav-item / 「查看全部 N 条」链接
  // 草稿区：跟普通文件一样支持菜单（"老师 100% 主权"——可重命名/移动/删除）
  function isCtxEligible(row){
    if(!row) return false;
    if(row.closest('.sidebar-foot')) return false;
    if(row.classList.contains('tree-more-link')) return false;
    return true;
  }

  // 事件委托：左栏右键
  document.addEventListener('contextmenu', (e)=>{
    const row = e.target.closest('.tree-row');
    if(row && row.closest('.sidebar-left')){
      if(!isCtxEligible(row)) return;
      const isFile = row.classList.contains('leaf') || row.classList.contains('file');
      showCtxMenu(e, isFile ? 'file' : 'folder', row);
      return;
    }
    if(e.target.closest('.sidebar-scroll')){
      showCtxMenu(e, 'blank', null);
    }
  });

  // 给 tree-row 注入 ··· 三点菜单按钮（hover 时显示）
  // 设计：跟右键菜单归一，点 ··· 等于在该行上右键
  // 参考 Moxt / Notion / Figma 的 row-more pattern
  function injectRowMoreButtons(){
    document.querySelectorAll('.sidebar-left .tree-row').forEach(row => {
      if(!isCtxEligible(row)) return;
      if(row.querySelector('.row-more')) return;
      const btn = document.createElement('button');
      btn.className = 'row-more';
      btn.title = '更多操作';
      btn.setAttribute('aria-label','更多操作');
      btn.innerHTML = '<i data-lucide="more-horizontal"></i>';
      btn.onclick = function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        const isFile = row.classList.contains('leaf') || row.classList.contains('file');
        // 用 ··· 按钮自身的位置作为菜单触发点
        const rect = btn.getBoundingClientRect();
        const fakeEvent = {
          preventDefault:()=>{}, stopPropagation:()=>{},
          clientX:rect.left, clientY:rect.bottom + 4
        };
        showCtxMenu(fakeEvent, isFile ? 'file' : 'folder', row);
      };
      row.appendChild(btn);
    });
    if(window.lucide) lucide.createIcons();
  }

  // @引用 下拉菜单：开/关
  // 设计哲学：传达"知识库 vs 外部 sources"边界
  // - 我的知识库：默认可用
  // - 学情/作文：需购买对应飞象产品（v1 灰色锁定）
  function toggleCiteMenu(e){
    if(e){ e.stopPropagation(); }
    const menu = document.getElementById('cite-menu');
    if(!menu) return;
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    if(window.lucide) lucide.createIcons();
  }
  function selectCiteSource(src){
    if(src === 'mykb'){
      showToast('✓ AI 默认基于「我的知识库」回答');
    }
    toggleCiteMenu();
  }
  // 点击外部关闭菜单
  document.addEventListener('click', (e)=>{
    const menu = document.getElementById('cite-menu');
    if(!menu || menu.style.display === 'none') return;
    if(!e.target.closest('.composer-cite-wrap')) menu.style.display = 'none';
  });

  // 最近对话区折叠 / 展开（v2 改名自 toggleDraftSection）
  function toggleRecentChatSection(){
    const list = document.getElementById('recent-chat-list');
    if(!list) return;
    list.classList.toggle('collapsed');
  }
  // 向后兼容（避免有遗漏的 onclick 引用）
  function toggleDraftSection(){ toggleRecentChatSection(); }

  // 点其他地方关菜单
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('#ctx-menu')) hideCtxMenu();
  });
  // ESC 关菜单
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') hideCtxMenu();
  });

  // 新建文件夹（mock）：弹 prompt → 插入左栏
  function createNewFolder(){
    const name = prompt('文件夹名（如：八下·二次函数）', '八下·二次函数');
    if(!name) return;
    const anchor = document.getElementById('user-folders-anchor');
    if(!anchor) return;
    const group = document.createElement('div');
    group.className = 'tree-group open';
    group.dataset.group = '';
    group.innerHTML = `
      <div class="tree-row" onclick="toggleGroup(this)">
        <span class="tree-arrow">▸</span>
        <span class="tree-label">${escapeHtml(name)}</span>
      </div>
      <div class="tree-children">
        <div class="tree-row" style="color:#A8A39B;font-size:11.5px;padding-left:18px;cursor:default">
          · 拖文件到这里 / 点顶栏「+ 添加」
        </div>
      </div>
    `;
    anchor.parentNode.insertBefore(group, anchor);
    showToast(`✓ 已创建文件夹「${name}」`);
    if(window.lucide) lucide.createIcons();
    // 新文件夹也注入 ··· 按钮
    if(typeof injectRowMoreButtons === 'function') injectRowMoreButtons();
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])}

  // ============ AI 对话核心动线 ============
  // 飞象差异化 = 基于素材的问答 + 引用源 + 一键保存到知识库（无中间草稿态）
  let recentChatCount = 12;
  function updateRecentChatCount(bump){
    const el = document.getElementById('nav-recent-chat-count');
    if(!el) return;
    el.textContent = recentChatCount;
    if(bump){
      el.classList.add('bump');
      setTimeout(()=>el.classList.remove('bump'), 600);
    }
  }
  // 向后兼容旧调用
  function updateDraftCount(bump){ updateRecentChatCount(bump); }
  function scrollChatToBottom(){
    const stream = document.getElementById('chat-stream');
    if(stream) stream.scrollTop = stream.scrollHeight;
  }
  function fmtTime(d){
    d = d || new Date();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    const h = String(d.getHours()).padStart(2,'0');
    const min = String(d.getMinutes()).padStart(2,'0');
    return `${m}-${day} ${h}:${min}`;
  }

  function sendChatMessage(){
    const input = document.getElementById('composer-text');
    let text = (input.value || '').trim();
    if(!text){
      // 演示用兜底问题
      text = '基于 02-09 月考的错题，帮我设计一份函数复习课';
    }
    input.value = '';

    // 隐藏 empty-hint
    const hint = document.querySelector('.chat-stream .empty-hint');
    if(hint) hint.style.display = 'none';

    // 给历史区加"今天"分隔（首次发送时）
    const stream = document.getElementById('chat-stream');
    if(!document.getElementById('today-divider')){
      const div = document.createElement('div');
      div.className = 'stream-day';
      div.id = 'today-divider';
      div.textContent = '今天';
      stream.appendChild(div);
    }

    const now = fmtTime();

    // 1. 用户消息
    const userMsg = document.createElement('div');
    userMsg.className = 'stream-msg user';
    userMsg.innerHTML = `
      <div class="stream-msg-head">
        <span class="smh-time">${now}</span>
        <span class="smh-name">你</span>
      </div>
      <div class="stream-bubble">${escapeHtml(text)}</div>
    `;
    stream.appendChild(userMsg);
    scrollChatToBottom();

    // 2. AI 思考态
    setTimeout(()=>{
      const aiMsg = document.createElement('div');
      aiMsg.className = 'stream-msg ai thinking';
      aiMsg.innerHTML = `
        <div class="stream-msg-head">
          <span class="ai-pulse-dot"></span>
          <span class="smh-name">飞象 AI</span>
          <span class="smh-time">${now}</span>
        </div>
        <div class="stream-bubble">
          <div class="thinking-dots"><span></span><span></span><span></span></div>
        </div>
      `;
      stream.appendChild(aiMsg);
      scrollChatToBottom();

      // 3. 1.2 秒后展开完整回答（半流式渐入）
      setTimeout(()=>showAiAnswer(aiMsg), 1200);
    }, 250);
  }

  function showAiAnswer(aiMsg){
    aiMsg.classList.remove('thinking');
    const bubble = aiMsg.querySelector('.stream-bubble');
    bubble.innerHTML = `
      <div class="reveal-step" data-step="1">
        基于你的
        <span class="ref-mark" onclick="openSource('02-09 月考真题.pdf')">[1] 02-09 月考真题</span>
        和
        <span class="ref-mark" onclick="openSource('八(3)班错题汇总.jpg')">[2] 八(3)班错题汇总</span>，
        给你一份 <b>3 段式函数复习课</b>——把错例放在最前面，效果会更扎实：
      </div>

      <div class="rcv-artifact reveal-step" data-step="2" onclick="openArtifactInCenter('函数复习课 · 教学设计','.docx','source')">
        <div class="rcv-art-icon"><i data-lucide="file-text"></i></div>
        <div class="rcv-art-body">
          <div class="rcv-art-name">函数复习课 · 教学设计<span class="rcv-art-ext">.docx</span></div>
          <div class="rcv-art-desc">3 段式 · 错例先行（10 分）→ 概念再梳（15 分）→ 变式训练（15 分）</div>
          <div class="rcv-art-meta">
            <span class="rcv-art-tag"><i data-lucide="clock-3"></i>约 520 字</span>
            <span class="rcv-art-tag"><i data-lucide="book-open"></i>教案</span>
            <span class="rcv-art-tag"><i data-lucide="link"></i>引用 3 份素材</span>
          </div>
        </div>
        <div class="rcv-art-actions">
          <button class="rcv-art-btn primary" onclick="event.stopPropagation();openArtifactInCenter('函数复习课 · 教学设计','.docx','source')"><i data-lucide="eye"></i>预览</button>
          <button class="rcv-art-btn ghost" onclick="event.stopPropagation();showToast('✓ 已保存到「我的知识库 › 数学 › 八下·二次函数」')"><i data-lucide="bookmark-plus"></i>保存到我的知识库</button>
        </div>
      </div>

      <div class="ai-refs reveal-step" data-step="3">
        <div class="ai-refs-head">参考素材（3 份 · 来自你的知识库）</div>
        <div class="ai-ref-list">
          <div class="ai-ref-item" onclick="openSource('02-09 月考真题.pdf')">
            <span class="ai-ref-num">1</span>
            <span class="ai-ref-icon"><i data-lucide="file-text"></i></span>
            <div class="ai-ref-text">
              <b>02-09 月考真题</b>
              <span>函数题部分 · 第 3 页</span>
            </div>
          </div>
          <div class="ai-ref-item" onclick="openSource('八(3)班错题汇总.jpg')">
            <span class="ai-ref-num">2</span>
            <span class="ai-ref-icon"><i data-lucide="image"></i></span>
            <div class="ai-ref-text">
              <b>八(3)班错题汇总</b>
              <span>函数错例扫描 · 共 8 张</span>
            </div>
          </div>
          <div class="ai-ref-item" onclick="openSource('二次函数图像与性质·导入课件.pptx')">
            <span class="ai-ref-num">3</span>
            <span class="ai-ref-icon"><i data-lucide="presentation"></i></span>
            <div class="ai-ref-text">
              <b>二次函数图像与性质·导入课件</b>
              <span>第 5 页 · 图像与代数对照</span>
            </div>
          </div>
        </div>
      </div>

    `;

    // 半流式：4 步渐入
    const steps = bubble.querySelectorAll('.reveal-step');
    steps.forEach((el, i)=>{
      setTimeout(()=>{
        el.classList.add('in');
        scrollChatToBottom();
      }, 280 * (i + 1));
    });

    // AI 回答完成 → 最近对话 +1（这次互动入"最近对话"列表）
    setTimeout(()=>{
      recentChatCount++;
      updateRecentChatCount(true);
    }, 280 * steps.length + 100);

    if(window.lucide) lucide.createIcons();
  }

  // 兼容旧调用
  function saveAsAiDraft(btn){ saveToMyKnowledgeBase(btn); }

  /* ===== AI 录入题库侧滑面板 ===== */
  function openQBankPanel(){
    document.getElementById('qbank-overlay').classList.add('show');
    document.getElementById('qbank-panel').classList.add('show');
    if(window.lucide) lucide.createIcons();
    updateQBankSelCount();
    // 绑定 checkbox 变更
    document.querySelectorAll('#qbp-list input[type=checkbox]').forEach(cb=>{
      cb.onchange = updateQBankSelCount;
    });
  }
  function closeQBankPanel(){
    document.getElementById('qbank-overlay').classList.remove('show');
    document.getElementById('qbank-panel').classList.remove('show');
  }
  function updateQBankSelCount(){
    const n = document.querySelectorAll('#qbp-list input[type=checkbox]:checked').length;
    const el = document.getElementById('qbp-sel-count');
    if(el) el.textContent = n;
  }
  function confirmAddToQBank(){
    const n = document.querySelectorAll('#qbp-list input[type=checkbox]:checked').length;
    closeQBankPanel();
    showToast('✓ ' + n + ' 道题已归到「我的题目」');
  }

  // 「问 AI 关于此文件」- 把文件名填入 AI 输入框并激活右侧栏
  function askAiAboutFile(){
    const srcHead = document.querySelector('.src-header');
    const title = srcHead ? (srcHead.querySelector('.src-file-name')?.textContent || srcHead.querySelector('h2')?.textContent || '当前文件') : '当前文件';
    const inp = document.getElementById('chat-input');
    if(inp){
      inp.value = '帮我分析「' + title.trim() + '」';
      inp.focus();
    }
    // 确保右侧 AI 栏可见
    const rSide = document.getElementById('sidebar-right');
    if(rSide && rSide.classList.contains('collapsed')) rSide.classList.remove('collapsed');
    showToast('💬 已为你打开 AI 对话');
  }

  function saveToMyKnowledgeBase(btn){
    const aiMsg = btn ? btn.closest('.stream-msg') : null;
    if(!aiMsg) return;
    const draftBlock = aiMsg.querySelector('.stream-draft');
    if(draftBlock){
      draftBlock.classList.add('saved');
      const meta = draftBlock.querySelector('.draft-mini-meta');
      if(meta) meta.innerHTML = '<i data-lucide="check"></i> 已保存到我的知识库';
    }
    // 替换 actions 为成功状态
    const actions = aiMsg.querySelector('.stream-actions');
    if(actions){
      actions.innerHTML = `
        <span class="saved-badge">
          <i data-lucide="check-circle-2"></i>
          已保存到我的知识库
        </span>
        <span class="stream-action ghost" onclick="openSource('函数复习课设计')">
          <i data-lucide="external-link"></i>在知识库中查看
        </span>
      `;
    }
    showToast('✓ 已保存到「数学 › 八下·二次函数」· 点左栏可查看');
    if(window.lucide) lucide.createIcons();
  }
  function regenerateAnswer(btn){
    showToast('（演示）重新生成会展开新版本回答');
  }
  function copyAnswer(btn){
    const aiMsg = btn.closest('.stream-msg');
    const text = aiMsg ? (aiMsg.innerText || '') : '';
    if(navigator.clipboard) navigator.clipboard.writeText(text).catch(()=>{});
    showToast('✓ 已复制到剪贴板');
  }
  // Enter 发送（Shift+Enter 换行）
  document.addEventListener('DOMContentLoaded', ()=>{
    const ta = document.getElementById('composer-text');
    if(ta){
      ta.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter' && !e.shiftKey){
          e.preventDefault();
          sendChatMessage();
        }
      });
    }
  });

  // 老消息中可能调用的兼容
  function switchTab(){}
  function goChat(){}

  // 右栏对话中各种 mock 操作的反馈
  function appendToast(text){
    showToast(text);
  }

  // 目录树折叠
  function toggleGroup(rowEl){
    const group = rowEl.closest('.tree-group');
    if(!group) return;
    group.classList.toggle('open');
    const isOpen = group.classList.contains('open');
  }

  // 添加抽屉
  // v3.6：上传 = 同标签跳转 upload.html，与首次从文件上传流程保持一致
  // 顶栏「+ 新对话」：先退出可能正在回顾的历史对话，再进入 focus-chat 欢迎页
  // 替代原右栏 cph-new-chat-btn 的双重职责（新建 / 退出回顾）
  function startNewChatFromTopbar(){
    try{
      if(typeof exitRecentChat === 'function') exitRecentChat();
    }catch(e){}
    if(typeof enterChatOnlyMode === 'function'){
      enterChatOnlyMode();
    }
  }

  function openUploadWindow(){
    window.location.href = 'upload.html';
  }

  // 旧抽屉的兼容函数（保留：万一某些遗漏入口还在调用，不会报错）
  function openImportDrawer(){
    // 兼容兜底：直接走上传页
    openUploadWindow();
  }
  function closeImportDrawer(){
    document.getElementById('import-overlay')?.classList.remove('show');
    document.getElementById('import-drawer')?.classList.remove('show');
  }

  // ============ v3.5 通知中心 ============
  // 异步任务收件箱：AI 切题 / 入库 / 归类 等所有"AI 完成事情"的反馈
  // 设计原则：AI 不主动弹气泡，反馈收敛到这一处铃铛入口
  function toggleNotifPanel(){
    const panel = document.getElementById('notif-panel');
    const overlay = document.getElementById('notif-overlay');
    if(!panel) return;
    if(panel.classList.contains('show')){
      closeNotifPanel();
    }else{
      panel.classList.add('show');
      if(overlay) overlay.style.display = 'block';
      // 打开即视为"已查看"，红点消失（保留通知列表）
      const dot = document.getElementById('notif-dot');
      if(dot) dot.style.display = 'none';
      if(window.lucide) lucide.createIcons();
    }
  }
  function closeNotifPanel(){
    const panel = document.getElementById('notif-panel');
    const overlay = document.getElementById('notif-overlay');
    if(panel) panel.classList.remove('show');
    if(overlay) overlay.style.display = 'none';
  }
  function clearAllNotifs(){
    const list = document.getElementById('notif-list');
    if(!list) return;
    list.innerHTML = `
      <div class="notif-empty">
        <i data-lucide="inbox"></i>
        <div class="notif-empty-t">没有新通知</div>
        <div class="notif-empty-d">AI 跑完任务会在这里告诉你</div>
      </div>
    `;
    const count = document.getElementById('notif-count');
    if(count) count.textContent = '';
    const dot = document.getElementById('notif-dot');
    if(dot) dot.style.display = 'none';
    if(window.lucide) lucide.createIcons();
  }
  // 通知里点"审核入库"→ 打开题库审核流程（mock：先关弹窗，弹个 toast）
  // 真实产品里这里会进侧滑审核面板（已有 AI 录入题库流程），demo 用 toast 说明意图
  function openQbankReview(){
    closeNotifPanel();
    showToast('→ 进入题目审核（演示版本：真实产品会打开 AI 录入「我的题目」的侧滑审核面板）');
  }
  // 演示用：模拟"AI 切题进度推进 + 完成时右栏写延迟回复消息"
  // 触发方式：上传抽屉关闭后调用一次（mockSelectFiles 之后）
  // v3.5 配合 B 方案：通知 + 右栏消息 双反馈
  let _notifProgressTimer = null;
  function startNotifProgressDemo(){
    const bar = document.getElementById('notif-bar-cutting');
    const item = document.getElementById('notif-item-cutting');
    if(!bar || !item) return;
    if(_notifProgressTimer) return;
    // 立刻亮起红点（让老师知道有新任务）
    const dot = document.getElementById('notif-dot');
    if(dot) dot.style.display = 'block';
    let pct = parseInt(bar.style.width) || 67;
    _notifProgressTimer = setInterval(()=>{
      pct = Math.min(100, pct + 4 + Math.random()*3);
      bar.style.width = pct + '%';
      const meta = item.querySelector('.notif-meta span');
      if(meta) meta.textContent = Math.floor(pct) + '% · 约 ' + Math.max(1, Math.ceil((100-pct)/8)) + ' 秒';
      if(pct >= 100){
        clearInterval(_notifProgressTimer);
        _notifProgressTimer = null;
        // 处理中那条变成"已完成 · 待审核"
        item.outerHTML = `
          <div class="notif-item" onclick="openQbankReview()">
            <div class="notif-icon review"><i data-lucide="file-check-2"></i></div>
            <div class="notif-body">
              <div class="notif-title">AI 已从《九年级月考卷.pdf》抽出 <b>12 道题</b></div>
              <div class="notif-desc">已归到「我的题目」 → 等你审核确认</div>
              <div class="notif-meta">
                <span>刚刚</span><span>·</span>
                <span class="notif-action">审核入库 →</span>
              </div>
            </div>
          </div>
        `;
        if(window.lucide) lucide.createIcons();
        // B 方案配套：右栏 AI 写一条延迟回复消息
        appendAIReplyForCutting();
      }
    }, 600);
  }
  // B 方案：AI 切题完成时，右栏对话流追加一条延迟回复
  // 这条消息算"老师上传动作的延迟回复"，不违反 §3.2（不是主动推送，是被传唤后异步完成的回应）
  function appendAIReplyForCutting(){
    const stream = document.getElementById('chat-stream');
    if(!stream) return;
    // 时间戳
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    stream.insertAdjacentHTML('beforeend', `
      <div class="stream-msg ai">
        <div class="stream-msg-head">
          <span class="ai-pulse-dot"></span>
          <span class="smh-name">飞象 AI</span>
          <span class="smh-time">${hh}:${mm}</span>
        </div>
        <div class="stream-bubble">
          已从《九年级月考卷.pdf》抽出 <b>12 道题</b>，归到「我的题目」（待审核），并打好了知识点和难度标签。
          <div style="margin-top:6px;font-size:12px;color:#7A766F">
            原文件还在「我的知识库 › 数学 › 月考与中考」，没动你的文件。
          </div>
          <div style="margin-top:10px">
            <button class="rcv-art-btn primary" onclick="openQbankReview()" style="padding:6px 12px;font-size:12px"><i data-lucide="file-check-2"></i>去「我的题目」审核</button>
          </div>
        </div>
      </div>
    `);
    stream.scrollTop = stream.scrollHeight;
    if(window.lucide) lucide.createIcons();
  }
  // v3.5：上传后立即关抽屉、亮通知红点、启动异步处理 demo
  // 改造意图：① 老师不被 block ② 反馈走通知中心，不弹气泡 ③ 单文件落点 = 根目录/未分类（A 方案，老师可手动拖）
  function mockSelectFiles(){
    closeImportDrawer();
    showToast('✓ 3 个文件已加入知识库 · AI 在后台抽题归到「我的题目」，进度看右上角铃铛');
    startNotifProgressDemo();
  }
  function pasteHint(){
    showToast('演示版本：实际产品支持 ⌘V 粘贴图片/截图/文本');
  }
  function confirmImport(){
    closeImportDrawer();
    setTimeout(()=>showToast('✓ 3 个文件已归位 · 你可以在左栏目录里看到它们'), 280);
  }
  function showToast(text){
    const t = document.getElementById('toast');
    document.getElementById('toast-text').textContent = text;
    t.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(()=>t.classList.remove('show'), 2400);
    if(window.lucide) lucide.createIcons();
  }

  // 初始化：URL ?scene= 决定演示场景（v3.5 新增三层默认状态规则）
  //
  // === 真实生产逻辑（基于 localStorage `feixiang_visited`）===
  //   首次打开（无 visited 标记）        → 自动打开「入门指南」(welcome-doc) + 设置 visited 标记
  //   非首次但知识库为空                  → 进 focus-chat 模式（Gemini 风格"今天想做点什么？"）
  //   非首次且知识库非空                  → 工作台 default（最近素材 + AI 在右）
  //
  // === 演示用 URL 参数（覆盖 localStorage 逻辑）===
  //   scene=new            模拟首次进入（自动清 localStorage）→ 打开入门指南
  //   scene=visited-empty  模拟"看过指南、空库" → focus-chat + Gemini 风格欢迎
  //   scene=daily          模拟老用户工作台 default
  //   scene=onboarding     上传扫描中
  //   scene=qbank          题库（有内容）
  //   scene=qbank-empty    题库空态
  //   scene=graph          兼容旧入口：进 default 后弹出研发图谱 demo
  // 兼容旧参数 ?ready=1 / ?demo=1（等价于 scene=daily）
  document.addEventListener('DOMContentLoaded', ()=>{
    const params = new URLSearchParams(window.location.search);
    const recentChatCountEl = document.getElementById('nav-recent-chat-count');
    const sbL = document.getElementById('sidebar-left');

    // 解析场景参数（兼容旧参数）
    let scene = params.get('scene') || document.body.dataset.scene || '';
    if(!scene && (params.get('ready') === '1' || params.get('demo') === '1')) scene = 'daily';

    // === v3.5 三层默认状态规则 ===
    // 无显式 scene 时，根据 localStorage 决定（真实产品逻辑）
    // 显式 scene=new 时强制清 localStorage 重新走首次流程（演示用）
    if(scene === 'new'){
      try{ localStorage.removeItem('feixiang_visited'); }catch(e){}
    }
    if(!scene){
      // Demo 默认始终进入首次入门指南视图（最能体现完整产品故事）
      // 真实产品逻辑见上方注释；演示时用 ?scene= 参数切换不同场景
      scene = 'new';
    }

    // 根据场景设置左栏空/满 + 中栏状态
    const setEmpty = ()=>{
      sbL.classList.add('empty');
      if(recentChatCountEl) recentChatCountEl.textContent = '1';
    };
    const setFilled = ()=>{
      sbL.classList.remove('empty');
      if(recentChatCountEl) recentChatCountEl.textContent = '12';
    };

    switch(scene){
      case 'empty':
        setEmpty();
        setState('empty');
        break;
      case 'onboarding':
        setEmpty();
        setState('onboarding-scan');
        break;
      case 'source':
        setFilled();
        setState('source');
        break;
      case 'recent-chat':
        setFilled();
        setState('recent-chat-view');
        break;
      case 'welcome-doc':
        setEmpty();
        setState('welcome-doc');
        break;
      case 'daily':
        setFilled();
        setState('default');
        // 演示老用户态时一并标记 visited（避免之后无 scene 参数刷新还看到首次态）
        try{ localStorage.setItem('feixiang_visited', '1'); }catch(e){}
        break;
      case 'qbank':
        setFilled();
        setState('qbank');
        break;
      case 'qbank-empty':
        setEmpty();
        setState('qbank-empty');
        break;
      case 'graph':
        // 兼容旧入口：进工作台 default 态后立即弹出研发实时数据 demo
        setFilled();
        setState('default');
        openGraphDemo();
        break;
      case 'visited-empty':
        // 看过指南、空库 → 进 focus-chat 模式（Gemini 风格欢迎页）
        setEmpty();
        setState('empty');                 // 中栏 state 不重要（focus-chat 时中栏隐藏）
        // 等 DOM 完全 ready 再切布局（避免初始 layout 闪烁）
        setTimeout(()=>{ if(typeof enterChatOnlyMode === 'function') enterChatOnlyMode(); }, 30);
        break;
      case 'new':
      default:
        // 首次进入 → 自动打开入门指南文件（在最近对话「你好·介绍下你自己」上）
        // 用 openRecentChat 而非 setState('welcome-doc')：保证三栏布局 + 右栏对话 + 中栏文件齐全
        setEmpty();
        setState('default');                       // 先初始化为 default，避免 empty 闪烁
        setTimeout(()=>{
          if(typeof openRecentChat === 'function'){
            openRecentChat('chat-welcome');
          } else {
            setState('welcome-doc');               // 兜底
          }
          // 标记已访问（下次进若 URL 无 scene 参数 → 走 visited-empty 路径）
          try{ localStorage.setItem('feixiang_visited', '1'); }catch(e){}
        }, 30);
    }

    // v3.6：upload.html 同标签上传完成后回跳到工作台，用参数/会话标记触发同一套异步通知流程
    const shouldRunUploadDone =
      params.get('uploadDone') === '1' ||
      (sessionStorage.getItem('feixiang_upload_done') === '1');
    if(shouldRunUploadDone){
      sessionStorage.removeItem('feixiang_upload_done');
      setTimeout(()=>{
        showToast('✓ 3 个文件已加入知识库 · AI 在后台抽题归到「我的题目」，进度看右上角铃铛');
        startNotifProgressDemo();
        if(params.get('uploadDone') === '1'){
          const cleanParams = new URLSearchParams(window.location.search);
          cleanParams.delete('uploadDone');
          const cleanSearch = cleanParams.toString();
          history.replaceState(null, '', window.location.pathname + (cleanSearch ? '?' + cleanSearch : ''));
        }
      }, 120);
    }

    if(window.lucide) lucide.createIcons();
    if(typeof injectRowMoreButtons === 'function') injectRowMoreButtons();
    if(typeof syncQbasketState === 'function') syncQbasketState();
  });

// ============ Spotlight 文件搜索 ============
  // 目的：给「精确知道文件名」的老师最快路径。语义查找走右栏 AI。
  // 数据来源：mock 当前 demo 中真实展示的文件清单（与左侧目录树同步）
  const SPOTLIGHT_FILES = [
    {n:'二次函数图像与性质·导入课件',e:'pptx',p:'数学 / 八下·二次函数',t:'今天 10:24'},
    {n:'二次函数·教学设计',e:'docx',p:'数学 / 八下·二次函数',t:'昨天'},
    {n:'函数综合·拔高训练',e:'pdf',p:'数学 / 八下·二次函数',t:'04-22'},
    {n:'变式题集·5 道',e:'AI',p:'数学 / 八下·二次函数',t:'昨天 16:08',ai:true},
    {n:'SAS 判定·公开课',e:'pptx',p:'数学 / 八下·全等三角形',t:'04-18'},
    {n:'全等三角形·错题集训',e:'pdf',p:'数学 / 八下·全等三角形',t:'04-15'},
    {n:'板书照·全等条件梳理',e:'jpg',p:'数学 / 八下·全等三角形',t:'04-12'},
    {n:'2024 杭州中考真题',e:'pdf',p:'数学 / 月考与中考',t:'04-08'},
    {n:'八(3)班·第一次月考',e:'pdf',p:'数学 / 月考与中考',t:'03-22'},
    {n:'月考分析·讲评稿',e:'docx',p:'数学 / 月考与中考',t:'03-25'},
    {n:'02-09 月考真题',e:'pdf',p:'数学 / 月考与中考',t:'02-09'},
    {n:'八(3)班错题汇总',e:'jpg',p:'数学 / 临时·待整理',t:'04-26'},
    {n:'学生手写·勾股扫描',e:'jpg',p:'数学 / 临时·待整理',t:'04-20'},
    {n:'微信收藏·导入题',e:'png',p:'数学 / 临时·待整理',t:'04-19'},
    {n:'朱自清·背影教案',e:'docx',p:'语文',t:'04-21'},
    {n:'岳阳楼记·课文精讲',e:'pptx',p:'语文',t:'04-14'},
    {n:'议论文写作·结构示范',e:'docx',p:'语文',t:'04-10'},
    {n:'八下古诗·背诵清单',e:'pdf',p:'语文',t:'04-05'},
    {n:'学生作文·我的家乡',e:'jpg',p:'语文',t:'04-02'},
    {n:'Unit 5 Listening 课件',e:'pptx',p:'英语',t:'04-23'},
    {n:'完形填空·解题技巧',e:'pdf',p:'英语',t:'04-19'},
    {n:'Reading Comprehension 训练',e:'docx',p:'英语',t:'04-11'},
    {n:'七年级单词·音节图卡',e:'jpg',p:'英语',t:'03-28'},
    {n:'勾股定理·古今证法',e:'pptx',p:'公开课资料',t:'03-15'},
    {n:'教研组评课记录',e:'docx',p:'公开课资料',t:'03-15'},
  ];

  function iconForExt(ext){
    if(ext === 'AI') return 'sparkles';
    if(['pptx','ppt','key'].includes(ext)) return 'monitor-play';
    if(['pdf'].includes(ext)) return 'file-text';
    if(['docx','doc'].includes(ext)) return 'file-text';
    if(['jpg','jpeg','png','gif','webp'].includes(ext)) return 'image';
    return 'file';
  }

  // ============ 左右栏折叠 ============
  // 设计意图：让老师在「专注阅读素材」「专注 AI 对话」「全屏看图谱」时
  //          可以临时收起干扰栏。VSCode/Cursor/Notion 标准 pattern。
  function toggleSidebar(side){
    const layout = document.querySelector('.layout');
    const cls = 'no-' + side;
    layout.classList.toggle(cls);
    const collapsed = layout.classList.contains(cls);
    const btn = document.getElementById('collapse-' + side);
    if(!btn) return;
    // 折叠时图标变 open 状态，提示「点击展开」
    const icon = side === 'left'
      ? (collapsed ? 'panel-left-open' : 'panel-left-close')
      : (collapsed ? 'panel-right-open' : 'panel-right-close');
    btn.innerHTML = `<i data-lucide="${icon}"></i>`;
    btn.title = collapsed
      ? (side === 'left' ? '展开左栏' : '展开 AI 对话栏')
      : (side === 'left' ? '收起左栏' : '收起 AI 对话栏');
    if(window.lucide) lucide.createIcons();
  }

  function openSpotlight(){
    const sl = document.getElementById('spotlight');
    sl.style.display = 'block';
    document.body.style.overflow = 'hidden';
    const input = document.getElementById('spotlight-input');
    input.value = '';
    renderSpotResults('');
    setTimeout(() => input.focus(), 30);
  }

  function closeSpotlight(){
    const sl = document.getElementById('spotlight');
    if(!sl) return;
    sl.style.display = 'none';
    document.body.style.overflow = '';
  }

  function renderSpotResults(query){
    const q = (query || '').trim().toLowerCase();
    const wrap = document.getElementById('spotlight-results');
    let list = SPOTLIGHT_FILES;
    if(q){
      list = list.filter(f => (f.n + ' ' + f.p + ' ' + f.e).toLowerCase().includes(q));
    }
    if(list.length === 0){
      wrap.innerHTML = `
        <div class="spot-empty">
          <div class="spot-empty-t">没找到匹配「${escapeHtml(query)}」的文件</div>
          <div class="spot-empty-d">试试在右栏问飞象 AI，可能是描述类查找</div>
        </div>`;
      return;
    }
    const limited = list.slice(0, 10);
    wrap.innerHTML =
      (q ? `<div class="spot-section">${list.length} 个匹配${list.length>10?' · 显示前 10':''}</div>`
         : '<div class="spot-section">最近</div>') +
      limited.map((f, i) => `
        <div class="spot-item${i === 0 ? ' active' : ''}"
             data-name="${escapeAttr(f.n)}.${escapeAttr(f.e)}"
             onmouseenter="setSpotActive(this)"
             onclick="openSpotResult(this)">
          <i data-lucide="${iconForExt(f.e)}" class="spot-item-icon ${f.ai?'ai':''}"></i>
          <div class="spot-item-text">
            <div class="spot-item-name">${highlightMatch(f.n, q)}<span class="spot-item-ext">.${f.e}</span></div>
            <div class="spot-item-path">${highlightMatch(f.p, q)}</div>
          </div>
          <div class="spot-item-time">${f.t || ''}</div>
        </div>
      `).join('');
    if(window.lucide) lucide.createIcons();
  }

  function setSpotActive(el){
    document.querySelectorAll('.spot-item.active').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
  }

  function openSpotResult(el){
    const name = el.getAttribute('data-name');
    closeSpotlight();
    if(typeof openSource === 'function') openSource(name);
  }

  // 简单字符高亮（不做正则，按 includes 起点切片，省心稳定）
  function highlightMatch(text, q){
    if(!q) return escapeHtml(text);
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q);
    if(idx === -1) return escapeHtml(text);
    return escapeHtml(text.slice(0, idx)) +
           '<mark>' + escapeHtml(text.slice(idx, idx + q.length)) + '</mark>' +
           escapeHtml(text.slice(idx + q.length));
  }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeAttr(s){ return escapeHtml(s); }

  // 输入实时过滤
  document.getElementById('spotlight-input').addEventListener('input', (e) => {
    renderSpotResults(e.target.value);
  });

  // 全局快捷键
  document.addEventListener('keydown', (e) => {
    const sl = document.getElementById('spotlight');
    const isOpen = sl && sl.style.display === 'block';

    // ⌘K / Ctrl+K：呼出
    if((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')){
      e.preventDefault();
      isOpen ? closeSpotlight() : openSpotlight();
      return;
    }
    if(!isOpen) return;

    // Esc：关闭
    if(e.key === 'Escape'){ e.preventDefault(); closeSpotlight(); return; }

    // ↑↓：切换选中
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault();
      const items = Array.from(document.querySelectorAll('.spot-item'));
      if(items.length === 0) return;
      let idx = items.findIndex(i => i.classList.contains('active'));
      if(idx === -1) idx = 0;
      items[idx].classList.remove('active');
      idx = e.key === 'ArrowDown'
        ? (idx + 1) % items.length
        : (idx - 1 + items.length) % items.length;
      items[idx].classList.add('active');
      items[idx].scrollIntoView({block:'nearest'});
      return;
    }

    // Enter：打开当前选中项
    if(e.key === 'Enter'){
      const active = document.querySelector('.spot-item.active');
      if(active){ e.preventDefault(); openSpotResult(active); }
    }
  });
