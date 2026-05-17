(() => {
  'use strict';

  // ===== BG Canvas =====
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let mouseX = 0, mouseY = 0, w, h;
  const particles = [];
  const COUNT = 45;

  function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  class P {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * w; this.y = Math.random() * h;
      this.s = Math.random() * 1.5 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3;
      this.o = Math.random() * 0.2 + 0.03;
      this.hue = Math.random() > 0.5 ? 15 : 40;
    }
    update() {
      const dx = mouseX - this.x, dy = mouseY - this.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 200) { const f = (200 - d) / 200 * 0.01; this.vx += dx * f * 0.01; this.vy += dy * f * 0.01; }
      this.vx *= 0.99; this.vy *= 0.99;
      this.x += this.vx; this.y += this.vy;
      if (this.x < -10 || this.x > w + 10 || this.y < -10 || this.y > h + 10) this.reset();
    }
    draw() {
      ctx.beginPath(); ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue},70%,65%,${this.o})`; ctx.fill();
    }
  }
  for (let i = 0; i < COUNT; i++) particles.push(new P());

  function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => { p.update(); p.draw(); });
    // connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) {
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `hsla(15,40%,50%,${(1 - d / 120) * 0.06})`; ctx.lineWidth = 0.4; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();

  // ===== Cursor Glow =====
  const glow = document.getElementById('cursorGlow');
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px';
  });

  // ===== Sidebar Toggle =====
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggleSidebar');
  const mobileMenu = document.getElementById('mobileMenu');
  toggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
  mobileMenu.addEventListener('click', () => sidebar.classList.toggle('open'));

  // ===== Right Panel Toggle =====
  const rightPanel = document.getElementById('rightPanel');
  const togglePipeline = document.getElementById('togglePipeline');
  const closePanel = document.getElementById('closePanel');
  togglePipeline.addEventListener('click', () => {
    if (window.innerWidth <= 1100) rightPanel.classList.toggle('open');
    else rightPanel.classList.toggle('closed');
  });
  closePanel.addEventListener('click', () => {
    if (window.innerWidth <= 1100) rightPanel.classList.remove('open');
    else rightPanel.classList.add('closed');
  });

  // ===== Theme Toggle =====
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
  });

  // ===== Agent Selector Dropdown =====
  const agentSelectBtn = document.getElementById('agentSelectBtn');
  const agentDropdown = document.getElementById('agentDropdown');
  const dropdownItems = document.querySelectorAll('.dropdown-item');

  agentSelectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    agentDropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    agentDropdown.classList.remove('open');
  });

  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      dropdownItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // ===== Agent List Click =====
  const agentItems = document.querySelectorAll('.agent-item');
  agentItems.forEach(item => {
    item.addEventListener('click', () => {
      agentItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // ===== Quick Prompts =====
  const input = document.getElementById('chatInput');
  document.querySelectorAll('.quick-prompt').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.prompt;
      input.focus();
      autoResize();
    });
  });

  // ===== Textarea Auto-resize =====
  function autoResize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 150) + 'px';
    // token estimate
    const tokens = Math.round(input.value.length / 4);
    document.querySelector('.token-count').textContent = `~${tokens} tokens`;
  }
  input.addEventListener('input', autoResize);

  // ===== Send Message (UI only) =====
  const sendBtn = document.getElementById('sendBtn');
  const chatMessages = document.getElementById('chatMessages');

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    // Add user message
    const msg = document.createElement('div');
    msg.className = 'message user-message';
    msg.innerHTML = `<div class="message-content"><p>${escapeHtml(text)}</p></div>`;
    chatMessages.appendChild(msg);

    input.value = '';
    autoResize();
    scrollToBottom();

    // Simulate orchestrator response
    setTimeout(() => addOrchestratorResponse(text), 800);
  }

  function addOrchestratorResponse(userText) {
    const msg = document.createElement('div');
    msg.className = 'message agent-message orchestrator-msg';
    msg.innerHTML = `
      <div class="message-header">
        <div class="agent-dot dot-purple"></div>
        <span class="msg-agent-name">Orchestrator</span>
        <span class="msg-badge streaming">● Routing</span>
      </div>
      <div class="message-content">
        <div class="routing-card glass-card">
          <div class="routing-title">📋 Analyzing task and assigning agents...</div>
          <div class="routing-tasks">
            <div class="route-task">
              <div class="route-agent"><div class="agent-dot dot-blue"></div>Research Agent</div>
              <span class="route-desc">Gathering context</span>
              <span class="route-status running">● Running</span>
            </div>
            <div class="route-task">
              <div class="route-agent"><div class="agent-dot dot-cyan"></div>Code Agent</div>
              <span class="route-desc">Standing by</span>
              <span class="route-status waiting">◦ Waiting</span>
            </div>
          </div>
        </div>
      </div>`;
    chatMessages.appendChild(msg);
    scrollToBottom();

    // Add feed item
    addFeedItem('Orchestrator', 'dot-purple', 'routing new task...');
  }

  function addFeedItem(agent, dotClass, text) {
    const feed = document.getElementById('feedList');
    const item = document.createElement('div');
    item.className = 'feed-item active';
    item.innerHTML = `
      <div class="feed-dot ${dotClass}"></div>
      <div class="feed-content"><strong>${agent}</strong> ${escapeHtml(text)}</div>
      <span class="feed-time">now</span>`;
    feed.insertBefore(item, feed.firstChild);
  }

  function escapeHtml(t) {
    const d = document.createElement('div'); d.textContent = t; return d.innerHTML;
  }
  function scrollToBottom() {
    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // ===== Copy Code =====
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.closest('.code-block').querySelector('code').textContent;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1500);
      });
    });
  });

  // ===== Conv List =====
  document.querySelectorAll('.conv-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.conv-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
})();
