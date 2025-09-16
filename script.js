// DOM 元素
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

// 模拟登录状态
let loggedInUser = localStorage.getItem('loggedInUser') || null;

// 页面切换
function showPanel(id) {
  panels.forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#sidebar nav a').forEach(link => link.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const link = document.querySelector(`#sidebar nav a[href="#${id}"]`);
  if (link) link.classList.add('active');
}

// 初始化路由
document.addEventListener('DOMContentLoaded', () => {
  // 默认首页
  showPanel('dashboard');

  // 绑定侧边栏导航
  sidebarLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const panelId = link.getAttribute('href').substring(1);
      showPanel(panelId);
    });
  });

  // 检查登录状态
  if (loggedInUser) {
    loginLink.textContent = `欢迎 ${loggedInUser}`;
    loginLink.href = '#';
    logoutBtn.style.display = 'flex';
  }

  // 加载简历和岗位数据
  loadResumeData();
  loadJobs();

  // 解析简历
  extractBtn.addEventListener('click', () => {
    const file = resumeUpload.files[0];
    if (!file) return alert('请选择简历文件！');

    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;

      // 纯前端无法解析 PDF/DOCX 内容，这里我们模拟提取
      // 实际中可集成 pdf.js 或 docx.js，但复杂度高
      // 为简化，我们提示用户手动输入
      alert('当前版本不支持自动解析 PDF/DOCX，请手动填写下方信息。\n\n（高级版可集成 pdf.js）');
      
      // 显示表单
      resumeFields.style.display = 'block';

      // 尝试从文件名猜测名字
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      const nameMatch = fileName.match(/([A-Za-z\u4e00-\u9fff]+)/);
      if (nameMatch && nameMatch[0]) {
        document.getElementById('name').value = nameMatch[0];
      }
    };
    reader.readAsText(file); // 仅用于文本文件，PDF需用 pdf.js
  });

  // 保存简历
  saveResumeBtn.addEventListener('click', () => {
    const data = {
      name: document.getElementById('name').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      education: document.getElementById('education').value.trim(),
      major: document.getElementById('major').value.trim(),
      experience: document.getElementById('experience').value.trim() || 0
    };

    if (!data.name || !data.email || !data.phone) {
      return alert('请填写必填项：姓名、邮箱、电话');
    }

    localStorage.setItem('userResume', JSON.stringify(data));
    loadResumeData();
    alert('简历保存成功！');
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
    alert('岗位已收藏！');
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

  // 一键填写网申
  fillBtn.addEventListener('click', async () => {
    const resume = JSON.parse(localStorage.getItem('userResume') || '{}');
    if (!resume.name) return alert('请先保存简历信息！');

    const mode = document.getElementById('auto-fill-mode').value;

    // 在当前页面注入脚本，自动填充表单
    // 注意：此代码仅在用户访问网申页面时生效，不能在本页面内测试
    alert(`
      已准备填充以下信息：
      姓名：${resume.name}
      电话：${resume.phone}
      邮箱：${resume.email}

      请打开任意网申页面（如智联、前程无忧），然后再次点击此按钮。
      本功能通过浏览器扩展实现，当前为演示模式。
      （真实部署建议开发 Chrome 插件）
    `);

    // 演示：在控制台输出填充指令
    console.log('【模拟填充】', resume);
    // 实际中，你需要开发 Chrome Extension，在目标页面注入 JS 填充表单
  });

  // 清除所有数据
  clearDataBtn.addEventListener('click', () => {
    if (confirm('确定要清除所有本地数据吗？包括简历和岗位收藏？')) {
      localStorage.removeItem('userResume');
      localStorage.removeItem('savedJobs');
      loadResumeData();
      loadJobs();
      alert('已清除所有数据');
    }
  });

  // 登录
  loginSubmit.addEventListener('click', () => {
    const user = usernameInput.value.trim();
    const pwd = passwordInput.value.trim();
    if (!user || !pwd) return alert('请输入用户名和密码');

    // 模拟登录（无加密，仅供本地）
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
});

// 加载简历数据
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

// 加载岗位列表
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
