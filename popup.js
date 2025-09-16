// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  // 切换标签页
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // 加载用户状态
  auth.onAuthStateChanged(user => {
    if (user) {
      loadResumeData();
      loadJobs();
      document.getElementById('logout-btn').style.display = 'inline-block';
      document.getElementById('resume-status').textContent = `${user.displayName || user.email}`;
    } else {
      showLoginScreen();
    }
  });

  // 上传并解析简历
  document.getElementById('resume-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let text = '';
    if (file.type === 'application/pdf') {
      text = await extractTextFromPDF(file);
    } else if (file.name.endsWith('.docx')) {
      text = await extractTextFromDOCX(file);
    } else {
      alert('仅支持 PDF 或 .docx 文件');
      return;
    }

    // 提取信息（简单规则）
    const info = parseResumeText(text);

    document.getElementById('name').value = info.name || '';
    document.getElementById('phone').value = info.phone || '';
    document.getElementById('email').value = info.email || '';
    document.getElementById('education').value = info.education || '';

    document.getElementById('resume-fields').style.display = 'block';
  });

  // 保存简历到云端
  document.getElementById('save-resume-btn').addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return alert('请先登录');

    const data = {
      name: document.getElementById('name').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      education: document.getElementById('education').value.trim(),
      major: document.getElementById('major')?.value.trim() || '',
      experience: document.getElementById('experience')?.value.trim() || 0,
      updatedAt: new Date().toISOString()
    };

    await db.collection('users').doc(user.uid).set({ resume: data });
    alert('简历已保存到云端！');
  });

  // 收藏岗位
  document.getElementById('save-job-btn').addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return alert('请先登录');

    const job = {
      title: document.getElementById('job-title').value.trim(),
      company: document.getElementById('company').value.trim(),
      salary: document.getElementById('salary').value.trim(),
      url: document.getElementById('job-url').value.trim(),
      savedAt: new Date().toISOString()
    };

    await db.collection('users').doc(user.uid).collection('jobs').add(job);
    alert('岗位已收藏！');
    loadJobs();
  });

  // 一键填写（触发 content.js）
  document.getElementById('fill-btn').addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return alert('请先登录并保存简历');

    const resume = await getUserResume();
    if (!resume) return alert('未找到简历信息');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: fillFormInPage,
        args: [resume]
      });
    });
  });

  // 退出登录
  document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut().then(() => {
      window.location.reload();
    });
  });

  // 清除数据
  document.getElementById('clear-data-btn').addEventListener('click', async () => {
    if (!confirm('确定要删除所有云端数据？')) return;
    const user = auth.currentUser;
    if (user) {
      await db.collection('users').doc(user.uid).delete();
      alert('数据已清除');
    }
  });

  // ===== 辅助函数 =====
  async function loadResumeData() {
    const user = auth.currentUser;
    if (!user) return;

    const doc = await db.collection('users').doc(user.uid).get();
    if (doc.exists) {
      const resume = doc.data().resume;
      if (resume) {
        document.getElementById('resume-status').textContent = `${resume.name} (${resume.email})`;
        document.getElementById('fill-btn').disabled = false;
      }
    }
  }

  async function loadJobs() {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await db.collection('users').doc(user.uid).collection('jobs').orderBy('savedAt', 'desc').get();
    const jobList = document.getElementById('job-list');
    jobList.innerHTML = '';

    if (snapshot.empty) {
      jobList.innerHTML = '<p style="color:#999;">暂无收藏</p>';
      return;
    }

    snapshot.docs.forEach(doc => {
      const job = doc.data();
      const div = document.createElement('div');
      div.className = 'job-item';
      div.innerHTML = `
        <strong>${job.title}</strong><br/>
        ${job.company} | ${job.salary || '面议'}<br/>
        <a href="${job.url}" target="_blank" style="color:#3498db;">查看</a>
        <button class="delete-btn" data-id="${doc.id}">删除</button>
      `;
      jobList.appendChild(div);
    });

    // 绑定删除
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        await db.collection('users').doc(user.uid).collection('jobs').doc(id).delete();
        loadJobs();
      });
    });
  }

  async function getUserResume() {
    const user = auth.currentUser;
    if (!user) return null;
    const doc = await db.collection('users').doc(user.uid).get();
    return doc.exists ? doc.data().resume : null;
  }

  function showLoginScreen() {
    document.getElementById('resume-status').textContent = '请登录';
    document.getElementById('fill-btn').disabled = true;
    document.getElementById('logout-btn').style.display = 'none';

    // 弹出登录框
    const loginDiv = document.createElement('div');
    loginDiv.style.marginTop = '20px';
    loginDiv.innerHTML = `
      <input type="email" id="login-email" placeholder="邮箱" style="width:100%;"><br/>
      <input type="password" id="login-password" placeholder="密码" style="width:100%; margin-top:8px;"><br/>
      <button id="login-submit" style="width:100%;">登录</button>
    `;
    document.querySelector('#dashboard').appendChild(loginDiv);

    document.getElementById('login-submit').addEventListener('click', async () => {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      try {
        await auth.signInWithEmailAndPassword(email, password);
        window.location.reload();
      } catch (err) {
        alert('登录失败：' + err.message);
      }
    });
  }
});

// ===== 简历文本解析器 =====
function parseResumeText(text) {
  const result = {};

  // 提取邮箱
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i);
  result.email = emailMatch ? emailMatch[0] : '';

  // 提取手机号（中国格式）
  const phoneMatch = text.match(/(?:\+?86[-\s]?|0)?1[3-9]\d{9}/g);
  result.phone = phoneMatch ? phoneMatch[0] : '';

  // 提取姓名（假设第一个中文词组是姓名）
  const nameMatch = text.match(/[\u4e00-\u9fa5]{2,4}/);
  result.name = nameMatch ? nameMatch[0] : '';

  // 教育
  const eduPatterns = ['本科', '硕士', '博士', '大专', '学士'];
  for (let edu of eduPatterns) {
    if (text.includes(edu)) {
      result.education = edu;
      break;
    }
  }

  return result;
}

// ===== PDF 解析（使用 pdf.js）=====
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ');
  }
  return text;
}

// ===== DOCX 解析（使用 docx.js）=====
async function extractTextFromDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await docx.Document.load(arrayBuffer);
  let text = '';
  doc.paragraphs.forEach(p => {
    text += p.text + '\n';
  });
  return text;
}
