// script.js —— 完全适用于 GitHub Pages 的纯前端版本
document.addEventListener('DOMContentLoaded', () => {
  const panels = document.querySelectorAll('.panel');
  const sidebarLinks = document.querySelectorAll('#sidebar nav a');
  const resumeUpload = document.getElementById('resume-upload');
  const extractBtn = document.getElementById('extract-btn');
  const resumeFields = document.getElementById('resume-fields');
  const saveResumeBtn = document.getElementById('save-resume-btn');
  const jobTitle = document.getElementById('job-title');
  const company = document.getElementById('company');
  const salary = document.getElementById('salary');
  const jobUrl = document.getElementById('job-url');
  const saveJobBtn = document.getElementById('save-job-btn');
  const jobList = document.getElementById('job-list');
  const fillBtn = document.getElementById('fill-btn');
  const clearDataBtn = document.getElementById('clear-data-btn');
  const loginLink = document.getElementById('login-link');
  const loginPanel = document.getElementById('login');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginSubmit = document.getElementById('login-submit');
  const loginMessage = document.getElementById('login-message');
  const logoutBtn = document.getElementById('logout-btn');
  const resumeStatus = document.getElementById('resume-status');
  const jobCount = document.getElementById('job-count');

  // 页面切换
  function showPanel(id) {
    panels.forEach(p => p.classList.remove('active'));
    sidebarLinks.forEach(link => link.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    const link = document.querySelector(`#sidebar nav a[href="#${id}"]`);
    if (link) link.classList.add('active');
  }

  // 初始化路由
  sidebarLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const panelId = link.getAttribute('href').substring(1);
      showPanel(panelId);
    });
  });

  // 检查登录状态
  let loggedInUser = localStorage.getItem('loggedInUser') || null;
  if (loggedInUser) {
    loginLink.textContent = `欢迎 ${loggedInUser}`;
    loginLink.href = '#';
    logoutBtn.style.display = 'flex';
  }

  // 加载简历和岗位数据
  loadResumeData();
  loadJobs();

  // 解析简历（PDF / DOCX）
  extractBtn.addEventListener('click', async () => {
    const file = resumeUpload.files[0];
    if (!file) return alert('请选择简历文件！');

    let text = '';
    try {
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        text = await extractTextFromDOCX(file);
      } else {
        return alert('仅支持 PDF 或 .docx 文件');
      }
    } catch (err) {
      return alert('解析失败：' + err.message);
    }

    const info = parseResumeText(text);

    document.getElementById('name').value = info.name || '';
    document.getElementById('phone').value = info.phone || '';
    document.getElementById('email').value = info.email || '';
    document.getElementById('education').value = info.education || '';

    resumeFields.style.display = 'block';
  });

  // 保存简历到 localStorage
  saveResumeBtn.addEventListener('click', () => {
    const data = {
      name: document.getElementById('name').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      education: document.getElementById('education').value.trim(),
      major: document.getElementById('major').value.trim() || '',
      experience: document.getElementById('experience').value.trim() || 0,
      savedAt: new Date().toISOString()
    };

    if (!data.name || !data.email || !data.phone) {
      return alert('请填写必填项：姓名、邮箱、电话');
    }

    localStorage.setItem('userResume', JSON.stringify(data));
    loadResumeData();
    alert('✅ 简历已保存到本地！');
    resumeFields.style.display = 'none';
  });

  // 收藏岗位
  saveJobBtn.addEventListener('click', () => {
    const title = jobTitle.value.trim();
    const comp = company.value.trim();
    const sal = salary.value.trim();
    const url = jobUrl.value.trim();

    if (!title || !comp || !url) return alert('请填写岗位名称、公司和链接');

    const job = {
      id: Date.now(),
      title,
      company: comp,
      salary: sal,
      url,
      savedAt: new Date().toLocaleString()
    };

    let jobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    jobs.push(job);
    localStorage.setItem('savedJobs', JSON.stringify(jobs));
    loadJobs();
    jobTitle.value = '';
    company.value = '';
    salary.value = '';
    jobUrl.value = '';
    alert('✅ 岗位已收藏！');
  });

  // 删除岗位
  jobList.addEventListener('click', e => {
    if (e.target.classList.contains('delete-btn')) {
      const id = parseInt(e.target.dataset.id);
      let jobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      jobs = jobs.filter(j => j.id !== id);
      localStorage.setItem('savedJobs', JSON.stringify(jobs));
      loadJobs();
    }
  });

  // 一键填写（模拟提示）
  fillBtn.addEventListener('click', () => {
    const resume = JSON.parse(localStorage.getItem('userResume') || '{}');
    if (!resume.name) return alert('请先保存简历信息！');

    alert(`
      已准备填充以下信息：
      姓名：${resume.name}
      电话：${resume.phone}
      邮箱：${resume.email}

      🔍 请打开任意招聘网站（如智联、前程无忧），
      手动复制粘贴以上信息到表单中。

      💡 提示：真正的“一键填写”需要开发 Chrome 扩展，因为浏览器出于安全限制，不允许网页脚本修改其他网站的表单。
    `);
  });

  // 清除所有数据
  clearDataBtn.addEventListener('click', () => {
    if (confirm('确定要清除所有本地数据吗？包括简历和岗位收藏？')) {
      localStorage.removeItem('userResume');
      localStorage.removeItem('savedJobs');
      loadResumeData();
      loadJobs();
      alert('🗑️ 已清除所有数据');
    }
  });

  // 登录
  loginSubmit.addEventListener('click', () => {
    const user = usernameInput.value.trim();
    const pwd = passwordInput.value.trim();
    if (!user || !pwd) return alert('请输入用户名和密码');

    localStorage.setItem('loggedInUser', user);
    loggedInUser = user;
    loginLink.textContent = `欢迎 ${user}`;
    loginLink.href = '#';
    logoutBtn.style.display = 'flex';
    loginMessage.textContent = '';
    showPanel('dashboard');
    usernameInput.value = '';
    passwordInput.value = '';
  });

  // 注销
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('loggedInUser');
    loggedInUser = null;
    loginLink.textContent = '<i class="fas fa-user"></i> 登录';
    loginLink.href = '#login';
    logoutBtn.style.display = 'none';
    showPanel('login');
  });

  // ===== 辅助函数：加载简历 =====
  function loadResumeData() {
    const resume = JSON.parse(localStorage.getItem('userResume') || '{}');
    if (resume.name) {
      resumeStatus.textContent = `${resume.name} (${resume.email})`;
      fillBtn.disabled = false;
    } else {
      resumeStatus.textContent = '未导入';
      fillBtn.disabled = true;
    }
  }

  // ===== 辅助函数：加载岗位 =====
  function loadJobs() {
    const jobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    jobCount.textContent = jobs.length;

    jobList.innerHTML = '';
    if (jobs.length === 0) {
      jobList.innerHTML = '<p style="color:#999;">暂无收藏岗位</p>';
      return;
    }

    jobs.forEach(job => {
      const card = document.createElement('div');
      card.className = 'job-card';
      card.innerHTML = `
        <div>
          <h4>${job.title}</h4>
          <p><strong>${job.company}</strong></p>
          <p>${job.salary || '面议'}</p>
          <p><small>${job.savedAt}</small></p>
          <a href="${job.url}" target="_blank" style="color: #3498db; text-decoration: none;">查看申请</a>
        </div>
        <button class="delete-btn" data-id="${job.id}">删除</button>
      `;
      jobList.appendChild(card);
    });
  }

  // ===== 解析 PDF 文本（使用 pdf.js）=====
  async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ');
    }
    return text;
  }

  // ===== 解析 DOCX 文本（使用 docx.js）=====
  async function extractTextFromDOCX(file) {
    const arrayBuffer = await file.arrayBuffer();
    const doc = await docx.Document.load(arrayBuffer);
    let text = '';
    doc.paragraphs.forEach(p => {
      text += p.text + '\n';
    });
    return text;
  }

  // ===== 提取简历关键字段 =====
  function parseResumeText(text) {
    const result = {};

    // 提取邮箱
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i);
    result.email = emailMatch ? emailMatch[0] : '';

    // 提取手机号（中国格式）
    const phoneMatch = text.match(/(?:\+?86[-\s]?|0)?1[3-9]\d{9}/g);
    result.phone = phoneMatch ? phoneMatch[0] : '';

    // 提取姓名（第一个连续2~4个中文词）
    const nameMatch = text.match(/[\u4e00-\u9fa5]{2,4}/);
    result.name = nameMatch ? nameMatch[0] : '';

    // 提取学历
    const eduPatterns = ['博士', '硕士', '本科', '学士', '大专', '高职', '中专', '高中'];
    for (let edu of eduPatterns) {
      if (text.includes(edu)) {
        result.education = edu;
        break;
      }
    }

    return result;
  }
});
