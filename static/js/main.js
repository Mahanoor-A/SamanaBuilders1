/* ==========================================================================
   ERP Nexus — Main JavaScript
   Theme switcher, sidebar toggle, counter animations, form validation,
   search filtering, confirm dialogs, table sorting, notifications,
   AJAX helpers, chart placeholder.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     Utilities
     ------------------------------------------------------------------------ */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const on = (el, evt, fn) => {
    (typeof el === 'string' ? $$(el) : [el]).forEach(e =>
      e.addEventListener(evt, fn)
    );
  };

  const delegate = (parent, selector, event, handler) => {
    (typeof parent === 'string' ? $(parent) : parent).addEventListener(event, e => {
      const target = e.target.closest(selector);
      if (target && (typeof parent === 'string' || parent.contains(target))) {
        handler.call(target, e);
      }
    });
  };

  /* ------------------------------------------------------------------------
     1. Theme Switcher
     ------------------------------------------------------------------------ */
  function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('erp-theme', themeName);
    // Update theme switcher buttons
    $$('.theme-switcher-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === themeName);
    });
  }

  function loadTheme() {
    const saved = localStorage.getItem('erp-theme');
    if (saved) setTheme(saved);
  }

  function initThemeSwitcher() {
    delegate(document, '.theme-switcher-btn', 'click', function () {
      setTheme(this.dataset.theme);
    });
  }

  /* ------------------------------------------------------------------------
     2. Sidebar Toggle
     ------------------------------------------------------------------------ */
  function initSidebar() {
    const toggle = $('.sidebar-toggle');
    const sidebar = $('.sidebar');
    const overlay = $('.sidebar-overlay');

    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    });

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }

    // Close sidebar on nav item click (mobile)
    $$('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
          if (overlay) overlay.classList.remove('active');
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     3. Auto-Counter Animations for Dashboard Stats
     ------------------------------------------------------------------------ */
  function animateCounters() {
    $$('[data-count-to]').forEach(el => {
      const target = parseInt(el.dataset.countTo, 10);
      const duration = parseInt(el.dataset.countDuration, 10) || 1500;
      const prefix = el.dataset.countPrefix || '';
      const suffix = el.dataset.countSuffix || '';
      const start = parseInt(el.dataset.countFrom, 10) || 0;
      const step = target >= start ? 1 : -1;

      let current = start;
      const increment = Math.max(1, Math.floor(Math.abs(target - start) / 30));
      const startTime = performance.now();

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out quad
        const eased = progress * (2 - progress);
        current = Math.round(start + (target - start) * eased);

        if (step > 0) {
          current = Math.min(current, target);
        } else {
          current = Math.max(current, target);
        }

        el.textContent = prefix + current.toLocaleString() + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = prefix + target.toLocaleString() + suffix;
        }
      }

      // Start animation when element enters viewport
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              requestAnimationFrame(update);
              observer.unobserve(el);
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------------
     4. Form Validation
     ------------------------------------------------------------------------ */
  function initFormValidation() {
    $$('[data-validate]').forEach(form => {
      form.addEventListener('submit', e => {
        let valid = true;

        $$('[required]', form).forEach(input => {
          const errorEl = input.parentElement.querySelector('.form-error');
          if (errorEl) errorEl.textContent = '';

          input.classList.remove('error');

          if (!input.value.trim()) {
            showFieldError(input, 'This field is required');
            valid = false;
          } else if (input.type === 'email' && !isValidEmail(input.value)) {
            showFieldError(input, 'Please enter a valid email address');
            valid = false;
          } else if (input.dataset.min && parseInt(input.value) < parseInt(input.dataset.min)) {
            showFieldError(input, `Minimum value is ${input.dataset.min}`);
            valid = false;
          } else if (input.dataset.max && parseInt(input.value) > parseInt(input.dataset.max)) {
            showFieldError(input, `Maximum value is ${input.dataset.max}`);
            valid = false;
          } else if (input.dataset.minlength && input.value.length < parseInt(input.dataset.minlength)) {
            showFieldError(input, `Minimum ${input.dataset.minlength} characters required`);
            valid = false;
          } else if (input.pattern && !new RegExp(input.pattern).test(input.value)) {
            showFieldError(input, input.dataset.patternMessage || 'Invalid format');
            valid = false;
          }
        });

        // Check password match
        const pw = $('[data-match]', form);
        if (pw) {
          const matchId = pw.dataset.match;
          const matchEl = $(`#${matchId}`, form);
          if (matchEl && pw.value !== matchEl.value) {
            showFieldError(pw, 'Passwords do not match');
            valid = false;
          }
        }

        if (!valid) e.preventDefault();
      });

      // Real-time validation on blur
      $$('[required], [data-min], [data-max], [data-minlength]', form).forEach(input => {
        input.addEventListener('blur', () => {
          const errorEl = input.parentElement.querySelector('.form-error');
          if (errorEl) errorEl.textContent = '';
          input.classList.remove('error');

          if (input.hasAttribute('required') && !input.value.trim()) {
            showFieldError(input, 'This field is required');
          }
        });

        input.addEventListener('input', () => {
          const errorEl = input.parentElement.querySelector('.form-error');
          if (errorEl) errorEl.textContent = '';
          input.classList.remove('error');
        });
      });
    });
  }

  function showFieldError(input, message) {
    input.classList.add('error');
    let errorEl = input.parentElement.querySelector('.form-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'form-error';
      input.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = message;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ------------------------------------------------------------------------
     5. Search Filtering
     ------------------------------------------------------------------------ */
  function initSearchFilters() {
    $$('[data-search]').forEach(input => {
      input.addEventListener('input', () => {
        const query = input.value.toLowerCase().trim();
        const target = input.dataset.search;
        const items = $$(target || '[data-filter-item]');

        items.forEach(item => {
          const text = item.textContent.toLowerCase();
          const match = !query || text.includes(query);
          item.style.display = match ? '' : 'none';
        });

        // Show/hide no-results message
        const container = input.closest('[data-search-container]');
        if (container) {
          const noResults = container.querySelector('[data-no-results]');
          if (noResults) {
            const visible = items.filter(i => i.style.display !== 'none');
            noResults.style.display = visible.length === 0 ? '' : 'none';
          }
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     6. Confirm Dialogs
     ------------------------------------------------------------------------ */
  function initConfirmDialogs() {
    delegate(document, '[data-confirm]', 'click', function (e) {
      const message = this.dataset.confirm || 'Are you sure?';
      const title = this.dataset.confirmTitle || 'Confirm';
      const confirmText = this.dataset.confirmText || 'Yes, proceed';
      const cancelText = this.dataset.confirmCancel || 'Cancel';
      const icon = this.dataset.confirmIcon || '⚠️';

      // If native confirm is preferred
      if (this.dataset.confirmNative) {
        if (!confirm(message)) {
          e.preventDefault();
        }
        return;
      }

      e.preventDefault();
      const href = this.getAttribute('href');
      const form = this.closest('form');

      showConfirmDialog({
        icon,
        title,
        message,
        confirmText,
        cancelText,
        confirmClass: this.dataset.confirmClass || 'btn-danger',
        onConfirm: () => {
          if (href && href !== '#') {
            window.location.href = href;
          } else if (form) {
            form.submit();
          }
        }
      });
    });
  }

  function showConfirmDialog({ icon, title, message, confirmText, cancelText, confirmClass, onConfirm }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal confirm-dialog">
        <div class="confirm-icon">${icon || '⚠️'}</div>
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" data-cancel>${cancelText || 'Cancel'}</button>
          <button class="btn ${confirmClass || 'btn-danger'}" data-confirm-yes>${confirmText || 'Yes, proceed'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => {
      overlay.classList.add('animate-fadeOut');
      setTimeout(() => overlay.remove(), 300);
    };

    overlay.querySelector('[data-cancel]').addEventListener('click', close);
    overlay.querySelector('[data-confirm-yes]').addEventListener('click', () => {
      close();
      if (onConfirm) onConfirm();
    });
    overlay.addEventListener('click', e => {
      if (e.target === overlay) close();
    });
  }

  /* ------------------------------------------------------------------------
     7. Table Sorting
     ------------------------------------------------------------------------ */
  function initTableSorting() {
    delegate(document, 'table th', 'click', function () {
      const table = this.closest('table');
      if (!table || !this.dataset.sort !== undefined && !this.getAttribute('data-sort')) return;

      const tbody = table.querySelector('tbody');
      if (!tbody) return;

      const colIndex = $$('th', table).indexOf(this);
      const type = this.dataset.sort || 'string';
      const isAsc = this.classList.contains('sort-asc');

      // Reset all headers
      $$('th', table).forEach(th => th.classList.remove('sort-asc', 'sort-desc'));

      // Set sort direction
      this.classList.add(isAsc ? 'sort-desc' : 'sort-asc');
      const ascending = !isAsc;

      const rows = Array.from(tbody.querySelectorAll('tr'));

      rows.sort((a, b) => {
        const aVal = (a.children[colIndex]?.textContent || '').trim();
        const bVal = (b.children[colIndex]?.textContent || '').trim();

        let result;
        if (type === 'number') {
          result = parseFloat(aVal) - parseFloat(bVal);
        } else if (type === 'date') {
          result = new Date(aVal) - new Date(bVal);
        } else {
          result = aVal.localeCompare(bVal);
        }

        return ascending ? result : -result;
      });

      rows.forEach(row => tbody.appendChild(row));
    });
  }

  /* ------------------------------------------------------------------------
     8. Notification / Toast Auto-Dismiss
     ------------------------------------------------------------------------ */
  function initNotifications() {
    // Auto-dismiss alerts with data-dismiss attribute
    $$('[data-dismiss]').forEach(el => {
      const timeout = parseInt(el.dataset.dismiss, 10) || 5000;
      setTimeout(() => {
        el.style.transition = 'opacity 0.3s ease';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
      }, timeout);
    });

    // Close button for alerts
    delegate(document, '.alert-close', 'click', function () {
      this.closest('.alert').remove();
    });
  }

  /* ---- Toast helper (for JS-triggered notifications) ---- */
  window.showToast = function ({ type = 'info', title, message, duration = 4000 } = {}) {
    let container = $('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: '✅',
      danger: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div>${message}</div>
      </div>
      <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));

    if (duration > 0) {
      setTimeout(() => dismissToast(toast), duration);
    }
  };

  function dismissToast(toast) {
    toast.classList.add('toast-leaving');
    setTimeout(() => toast.remove(), 300);
  }

  /* ------------------------------------------------------------------------
     9. AJAX Helpers
     ------------------------------------------------------------------------ */
  window.ErpAPI = {
    /**
     * Make an AJAX request.
     * @param {string} url       - Endpoint URL
     * @param {object} options   - { method, body, headers, params }
     * @returns {Promise}
     */
    async request(url, options = {}) {
      const { method = 'GET', body, headers = {}, params } = options;

      if (params) {
        const qs = new URLSearchParams(params).toString();
        url += (url.includes('?') ? '&' : '?') + qs;
      }

      const config = {
        method,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
          ...headers
        },
      };

      if (body) {
        config.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      // Include CSRF token if available
      const csrfMeta = document.querySelector('meta[name="csrf-token"]');
      if (csrfMeta) {
        config.headers['X-CSRFToken'] = csrfMeta.getAttribute('content');
      }

      try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
          throw { status: response.status, data };
        }

        return data;
      } catch (error) {
        console.error('[ErpAPI] Request failed:', error);
        throw error;
      }
    },

    get(url, params) {
      return this.request(url, { method: 'GET', params });
    },

    post(url, body) {
      return this.request(url, { method: 'POST', body });
    },

    put(url, body) {
      return this.request(url, { method: 'PUT', body });
    },

    delete(url) {
      return this.request(url, { method: 'DELETE' });
    },

    /**
     * Load HTML content into an element.
     */
    async load(url, targetEl) {
      try {
        const resp = await fetch(url, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const html = await resp.text();
        const el = typeof targetEl === 'string' ? $(targetEl) : targetEl;
        if (el) el.innerHTML = html;
        return html;
      } catch (error) {
        console.error('[ErpAPI] Load failed:', error);
        throw error;
      }
    }
  };

  /* ------------------------------------------------------------------------
     10. Chart Placeholder
     ------------------------------------------------------------------------ */
  function initCharts() {
    $$('[data-chart]').forEach(el => {
      const chartType = el.dataset.chart || 'bar';
      renderChartPlaceholder(el, chartType);
    });
  }

  function renderChartPlaceholder(container, type) {
    // Clear any existing placeholder
    container.innerHTML = '';

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 400 200');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.display = 'block';

    // Colors based on theme
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#1a73e8';
    const light = getComputedStyle(document.documentElement).getPropertyValue('--primary-light').trim() || '#e8f0fe';
    const muted = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#64748b';

    if (type === 'line') {
      // Line chart placeholder
      const polyline = document.createElementNS(svgNS, 'polyline');
      const points = '50,160 100,120 150,140 200,70 250,90 300,50 350,80';
      polyline.setAttribute('points', points);
      polyline.setAttribute('fill', 'none');
      polyline.setAttribute('stroke', primary);
      polyline.setAttribute('stroke-width', '3');
      polyline.setAttribute('stroke-linecap', 'round');
      polyline.setAttribute('stroke-linejoin', 'round');

      // Area fill
      const area = document.createElementNS(svgNS, 'polygon');
      area.setAttribute('points', `50,160 50,160 100,120 150,140 200,70 250,90 300,50 350,80 350,160`);
      area.setAttribute('fill', light);
      area.setAttribute('opacity', '0.5');

      // Grid lines
      for (let y = 40; y <= 160; y += 40) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', '40');
        line.setAttribute('y1', y);
        line.setAttribute('x2', '360');
        line.setAttribute('y2', y);
        line.setAttribute('stroke', muted);
        line.setAttribute('stroke-opacity', '0.15');
        line.setAttribute('stroke-dasharray', '4,4');
        svg.appendChild(line);
      }

      svg.appendChild(area);
      svg.appendChild(polyline);
    } else if (type === 'doughnut' || type === 'pie') {
      // Donut chart placeholder
      const cx = 200, cy = 100, r = 70, ir = 40;
      const vals = [35, 25, 20, 20];
      const colors = [primary, '#f59e0b', '#10b981', '#8b5cf6'];
      let startAngle = -Math.PI / 2;
      const total = vals.reduce((a, b) => a + b, 0);

      vals.forEach((val, i) => {
        const angle = (val / total) * 2 * Math.PI;
        const endAngle = startAngle + angle;

        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);

        const largeArc = angle > Math.PI ? 1 : 0;

        const path = document.createElementNS(svgNS, 'path');
        const d = `M ${cx + ir * Math.cos(startAngle)} ${cy + ir * Math.sin(startAngle)}
                   L ${x1} ${y1}
                   A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}
                   L ${cx + ir * Math.cos(endAngle)} ${cy + ir * Math.sin(endAngle)}
                   A ${ir} ${ir} 0 ${largeArc} 0 ${cx + ir * Math.cos(startAngle)} ${cy + ir * Math.sin(startAngle)} Z`;
        path.setAttribute('d', d);
        path.setAttribute('fill', colors[i % colors.length]);
        svg.appendChild(path);

        startAngle = endAngle;
      });
    } else {
      // Bar chart placeholder (default)
      const bars = [
        { x: 60, h: 100 },
        { x: 110, h: 140 },
        { x: 160, h: 80 },
        { x: 210, h: 160 },
        { x: 260, h: 120 },
        { x: 310, h: 90 },
      ];

      // Grid lines
      for (let y = 40; y <= 160; y += 40) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', '50');
        line.setAttribute('y1', y);
        line.setAttribute('x2', '350');
        line.setAttribute('y2', y);
        line.setAttribute('stroke', muted);
        line.setAttribute('stroke-opacity', '0.15');
        line.setAttribute('stroke-dasharray', '4,4');
        svg.appendChild(line);
      }

      bars.forEach((bar, i) => {
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', bar.x);
        rect.setAttribute('y', 170 - bar.h);
        rect.setAttribute('width', '30');
        rect.setAttribute('height', bar.h);
        rect.setAttribute('rx', '4');
        rect.setAttribute('fill', primary);
        rect.setAttribute('opacity', 0.7 + i * 0.05);

        // Hover effect
        rect.style.transition = 'opacity 0.2s';
        rect.addEventListener('mouseenter', () => rect.setAttribute('opacity', '1'));
        rect.addEventListener('mouseleave', () => rect.setAttribute('opacity', 0.7 + i * 0.05));

        svg.appendChild(rect);
      });
    }

    container.appendChild(svg);
  }

  /* ------------------------------------------------------------------------
     11. Dropdown Toggle
     ------------------------------------------------------------------------ */
  function initDropdowns() {
    delegate(document, '[data-dropdown]', 'click', function (e) {
      e.stopPropagation();
      const menu = this.nextElementSibling;
      if (!menu || !menu.classList.contains('dropdown-menu')) return;

      // Close other open dropdowns
      $$('.dropdown-menu.open').forEach(m => {
        if (m !== menu) m.classList.remove('open');
      });

      menu.classList.toggle('open');
    });

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      $$('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
    });
  }

  /* ------------------------------------------------------------------------
     12. Tab Switching
     ------------------------------------------------------------------------ */
  function initTabs() {
    delegate(document, '[data-tab]', 'click', function () {
      const tabId = this.dataset.tab;
      const container = this.closest('[data-tabs]') || this.parentElement;

      $$('[data-tab]', container).forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      const panelContainer = container.nextElementSibling || $(`[data-tab-panels="${container.id}"]`);
      if (panelContainer) {
        $$('[data-tab-panel]', panelContainer).forEach(p => p.classList.remove('active'));
        const panel = $(`[data-tab-panel="${tabId}"]`, panelContainer);
        if (panel) panel.classList.add('active');
      }
    });
  }

  /* ------------------------------------------------------------------------
     Initialize Everything
     ------------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    initThemeSwitcher();
    initSidebar();
    animateCounters();
    initFormValidation();
    initSearchFilters();
    initConfirmDialogs();
    initTableSorting();
    initNotifications();
    initCharts();
    initDropdowns();
    initTabs();
  });

})();