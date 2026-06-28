/* ============================================================
   ATSReady — script.js
   ============================================================ */

const API_URL = 'http://localhost:8080/api/analise';

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();

  initNavbarScroll();
  initMobileMenu();
  initSmoothScroll();
  initScrollAnimations();
  initCharCounter();
  initDropzone();
  initForm();
});

/* ------------------------------------------------------------
   1. Navbar scroll effect
------------------------------------------------------------ */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ------------------------------------------------------------
   2. Menu mobile (hamburger + slide-in)
------------------------------------------------------------ */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileOverlay');
  const closeBtn = document.getElementById('mobileClose');
  if (!hamburger || !menu || !overlay) return;

  const open = () => {
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    overlay.hidden = true;
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay.addEventListener('click', close);
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

/* ------------------------------------------------------------
   3. Smooth scroll (links âncora)
------------------------------------------------------------ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ------------------------------------------------------------
   4. Scroll animations (IntersectionObserver, fade-up)
------------------------------------------------------------ */
function initScrollAnimations() {
  const items = document.querySelectorAll('[data-animate]');
  if (!('IntersectionObserver' in window) || !items.length) {
    items.forEach((el) => el.classList.add('in-view'));
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  items.forEach((el) => observer.observe(el));
}

/* ------------------------------------------------------------
   5. Contador de caracteres
------------------------------------------------------------ */
function initCharCounter() {
  const textarea = document.getElementById('jobDesc');
  const counter = document.getElementById('charCount');
  if (!textarea || !counter) return;
  const max = textarea.getAttribute('maxlength') || 8000;
  const update = () => { counter.textContent = `${textarea.value.length} / ${max}`; };
  update();
  textarea.addEventListener('input', update);
}

/* ------------------------------------------------------------
   6. Drag & Drop de upload
------------------------------------------------------------ */
let selectedFile = null;

function initDropzone() {
  const dropzone = document.getElementById('dropzone');
  const input = document.getElementById('fileInput');
  const emptyView = document.getElementById('dropzoneEmpty');
  const filledView = document.getElementById('dropzoneFilled');
  const fileNameEl = document.getElementById('fileName');
  const removeBtn = document.getElementById('fileRemove');
  const fileError = document.getElementById('fileError');
  if (!dropzone || !input) return;

  const setFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showError(fileError, 'Apenas arquivos PDF são aceitos.');
      return;
    }
    selectedFile = file;
    fileNameEl.textContent = file.name;
    emptyView.hidden = true;
    filledView.hidden = false;
    hideError(fileError);
    if (window.lucide) lucide.createIcons();
  };

  const clearFile = () => {
    selectedFile = null;
    input.value = '';
    emptyView.hidden = false;
    filledView.hidden = true;
  };

  // Clique para abrir o seletor
  dropzone.addEventListener('click', (e) => {
    if (e.target.closest('#fileRemove')) return;
    input.click();
  });
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });

  input.addEventListener('change', () => setFile(input.files[0]));

  // Drag events
  ['dragenter', 'dragover'].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    })
  );
  ['dragleave', 'drop'].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      if (evt === 'dragleave' && dropzone.contains(e.relatedTarget)) return;
      dropzone.classList.remove('dragover');
    })
  );
  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer?.files?.[0];
    setFile(file);
  });

  removeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    clearFile();
  });
}

/* ------------------------------------------------------------
   7. Submissão do formulário + render dos resultados
------------------------------------------------------------ */
function initForm() {
  const form = document.getElementById('analyzeForm');
  const submitBtn = document.getElementById('submitBtn');
  const fileError = document.getElementById('fileError');
  const descError = document.getElementById('descError');
  const textarea = document.getElementById('jobDesc');
  const result = document.getElementById('result');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validação
    let valid = true;
    if (!selectedFile) { showError(fileError, 'Selecione um arquivo PDF para continuar.'); valid = false; }
    else hideError(fileError);

    if (!textarea.value.trim()) { showError(descError, 'Cole a descrição da vaga para continuar.'); valid = false; }
    else hideError(descError);

    if (!valid) return;

    setLoading(submitBtn, true);
    hideResult(result);

    try {
      const formData = new FormData();
      formData.append('curriculo', selectedFile);
      formData.append('descricaoVaga', textarea.value.trim());

      const response = await fetch(API_URL, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      renderResult(result, data);
    } catch (err) {
      console.error('Erro na análise:', err);
      renderError(result);
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

/* ------------------------------------------------------------
   Helpers de UI
------------------------------------------------------------ */
function showError(el, msg) {
  if (!el) return;
  if (msg) el.textContent = msg;
  el.hidden = false;
}
function hideError(el) { if (el) el.hidden = true; }

function setLoading(btn, loading) {
  if (!btn) return;
  const label = btn.querySelector('.btn-label');
  const spinner = btn.querySelector('.spinner');
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
  if (label) label.textContent = loading ? 'Analisando...' : 'Analisar Currículo';
  if (spinner) spinner.hidden = !loading;
}

function hideResult(el) {
  if (!el) return;
  el.hidden = true;
  el.classList.remove('show');
}

/* Classifica o score em faixa de cor/status */
function classify(score) {
  if (score >= 75) return { color: 'var(--success)', cls: 'success', badge: 'badge-success', label: 'Alta aderência', text: 'Seu currículo vai direto pro topo da pilha.' };
  if (score >= 50) return { color: 'var(--warning)', cls: 'warn', badge: 'badge-warning', label: 'Média aderência', text: 'Você entra na fila, mas sem prioridade.' };
  return { color: 'var(--error)', cls: 'low', badge: 'badge-error', label: 'Baixa aderência', text: 'Seu currículo corre risco de ser descartado automaticamente.' };
}

/* ------------------------------------------------------------
   Render do resultado
------------------------------------------------------------ */
function renderResult(container, data) {
  if (!container) return;

  // Normaliza a resposta da API (com fallbacks tolerantes a nomes diferentes)
  const overall = clampScore(data.scoreGeral ?? data.score ?? data.scoreTotal ?? 0);
  const status = classify(overall);

  const categorias = normalizeCategories(data);
  const sugestoes = data.sugestoes ?? data.suggestions ?? data.recomendacoes ?? [];

  const barsHtml = categorias.map((c) => {
    const cat = classify(c.score);
    return `
      <div class="result-bar">
        <div class="bar-top">
          <span class="bar-name">${escapeHtml(c.nome)}</span>
          <span class="bar-val" style="color:${cat.color}">${c.score}%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill ${cat.cls}" data-target="${c.score}" style="width:0%"></div>
        </div>
        ${c.feedback ? `<p class="bar-feedback">${escapeHtml(c.feedback)}</p>` : ''}
      </div>`;
  }).join('');

  const suggestionsHtml = sugestoes.length ? `
    <div class="result-suggestions">
      <h4><i data-lucide="lightbulb"></i> Sugestões de melhoria</h4>
      <div class="suggestion-list">
        ${sugestoes.map((s) => `
          <div class="suggestion-item">
            <i data-lucide="lightbulb"></i>
            <span>${escapeHtml(typeof s === 'string' ? s : (s.texto ?? s.text ?? ''))}</span>
          </div>`).join('')}
      </div>
    </div>` : '';

  container.innerHTML = `
    <div class="result-score">
      <div class="result-ring" style="background: conic-gradient(${status.color} 0%, rgba(255,255,255,0.08) 0);">
        <div class="result-ring-inner">
          <span class="result-score-num">0<small>%</small></span>
        </div>
      </div>
      <span class="badge ${status.badge}">${status.label}</span>
      <p class="result-score-label">${escapeHtml(data.resumo ?? status.text)}</p>
    </div>
    <div class="result-bars">${barsHtml}</div>
    ${suggestionsHtml}
  `;

  container.hidden = false;
  // força reflow para reiniciar a animação
  void container.offsetWidth;
  container.classList.add('show');
  if (window.lucide) lucide.createIcons();

  animateScoreRing(container, overall, status.color);
  animateBars(container);

  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderError(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="result-error">
      <span class="err-icon"><i data-lucide="alert-triangle"></i></span>
      <h4>Não foi possível analisar agora</h4>
      <p>Verifique sua conexão ou se o servidor está ativo e tente novamente em instantes.</p>
    </div>`;
  container.hidden = false;
  void container.offsetWidth;
  container.classList.add('show');
  if (window.lucide) lucide.createIcons();
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ------------------------------------------------------------
   Animações dos resultados
------------------------------------------------------------ */
function animateScoreRing(container, target, color) {
  const ring = container.querySelector('.result-ring');
  const numEl = container.querySelector('.result-score-num');
  if (!ring || !numEl) return;

  const duration = 1200;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    const val = Math.round(target * eased);
    ring.style.background = `conic-gradient(${color} ${val}%, rgba(255,255,255,0.08) 0)`;
    numEl.innerHTML = `${val}<small>%</small>`;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function animateBars(container) {
  const fills = container.querySelectorAll('.bar-fill[data-target]');
  requestAnimationFrame(() => {
    fills.forEach((fill) => {
      fill.style.width = `${clampScore(fill.dataset.target)}%`;
    });
  });
}

/* ------------------------------------------------------------
   Normalização de dados
------------------------------------------------------------ */
function normalizeCategories(data) {
  // Aceita data.categorias (array) ou objeto chaveado
  if (Array.isArray(data.categorias)) {
    return data.categorias.map((c) => ({
nome: c.descricao ?? c.categoria ?? c.nome ?? c.name ?? '—',      score: clampScore(c.score ?? c.valor ?? 0),
      feedback: c.feedback ?? c.descricao ?? '',
    }));
  }

  // Fallback: monta a partir de campos individuais conhecidos
  const map = [
    { key: 'palavrasChave', alt: 'keywords', nome: 'Palavras-Chave' },
    { key: 'cronologia', alt: 'chronology', nome: 'Cronologia' },
    { key: 'impacto', alt: 'impact', nome: 'Impacto' },
    { key: 'formatacao', alt: 'formatting', nome: 'Formatação' },
  ];
  return map
    .filter((m) => data[m.key] != null || data[m.alt] != null)
    .map((m) => {
      const raw = data[m.key] ?? data[m.alt];
      const val = typeof raw === 'object' ? (raw.score ?? raw.valor ?? 0) : raw;
      const feedback = typeof raw === 'object' ? (raw.feedback ?? raw.descricao ?? '') : '';
      return { nome: m.nome, score: clampScore(val), feedback };
    });
}

function clampScore(v) {
  const n = Math.round(Number(v) || 0);
  return Math.max(0, Math.min(100, n));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
