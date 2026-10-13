/**
 * Shoora EB-5 AI Chatbot Embeddable Widget Script
 * Embed this script on any website to display the floating Shoora EB-5 AI Chatbot.
 *
 * Example:
 * <script src="https://your-domain.com/widget.js" 
 *         data-position="bottom-right" 
 *         data-color="#C9A84C" 
 *         async></script>
 */

(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.__SHOORA_WIDGET_LOADED__) return;
  window.__SHOORA_WIDGET_LOADED__ = true;

  // Find script element and extract configuration
  const currentScript =
    document.currentScript ||
    document.querySelector('script[src*="widget.js"]') ||
    document.querySelector('script[data-shoora-widget]');

  let scriptUrl = 'http://localhost:5173';
  if (currentScript && currentScript.src) {
    try {
      const parsed = new URL(currentScript.src);
      scriptUrl = parsed.origin;
    } catch (e) {
      // fallback to default
    }
  }

  const hostUrl = (currentScript && currentScript.getAttribute('data-host')) || scriptUrl;
  const position = (currentScript && currentScript.getAttribute('data-position')) || 'bottom-right';
  const primaryColor = (currentScript && currentScript.getAttribute('data-color')) || '#C9A84C';
  const botTitle = (currentScript && currentScript.getAttribute('data-title')) || 'Shoora EB-5 Advisor';

  const isLeft = position === 'bottom-left';

  // Inject Stylesheet
  const style = document.createElement('style');
  style.id = 'shoora-widget-styles';
  style.textContent = `
    .shoora-widget-launcher {
      position: fixed;
      bottom: 26px;
      ${isLeft ? 'left: 26px;' : 'right: 26px;'}
      width: 66px;
      height: 66px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #17386d 0%, #091a38 65%, #051024 100%);
      box-shadow: 
        0 14px 34px -4px rgba(5, 16, 36, 0.55),
        0 6px 18px rgba(201, 168, 76, 0.38),
        inset 0 1.5px 2px rgba(255, 255, 255, 0.3),
        inset 0 -2px 4px rgba(0, 0, 0, 0.5);
      border: 2px solid rgba(220, 185, 95, 0.95);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none;
    }
    .shoora-widget-launcher:hover {
      transform: scale(1.08) translateY(-3px);
      box-shadow: 
        0 20px 42px -4px rgba(5, 16, 36, 0.65),
        0 8px 24px rgba(201, 168, 76, 0.55),
        inset 0 1.5px 2px rgba(255, 255, 255, 0.45);
      border-color: #f7df94;
    }
    .shoora-widget-launcher:active {
      transform: scale(0.96) translateY(0);
    }

    /* Radar Beacon Status */
    .shoora-widget-beacon {
      position: absolute;
      top: 1px;
      right: 1px;
      width: 16px;
      height: 16px;
      pointer-events: none;
    }
    .shoora-beacon-core {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: radial-gradient(circle at 35% 35%, #34d399, #059669);
      border: 2px solid #061329;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }
    .shoora-beacon-ring {
      position: absolute;
      top: 0px;
      right: 0px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.45);
      animation: shooraRadarPing 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    @keyframes shooraRadarPing {
      0% {
        transform: scale(0.8);
        opacity: 0.9;
      }
      70%, 100% {
        transform: scale(2.4);
        opacity: 0;
      }
    }

    /* Interactive Welcome Teaser Callout Card */
    .shoora-widget-teaser {
      position: absolute;
      bottom: 82px;
      ${isLeft ? 'left: 0;' : 'right: 0;'}
      width: 290px;
      background: linear-gradient(135deg, rgba(8, 22, 48, 0.96) 0%, rgba(13, 34, 72, 0.96) 100%);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #FFFFFF;
      padding: 12px 14px;
      border-radius: 18px;
      box-shadow: 
        0 16px 36px -6px rgba(5, 16, 36, 0.5),
        0 4px 14px rgba(201, 168, 76, 0.25);
      border: 1px solid rgba(220, 185, 95, 0.45);
      cursor: pointer;
      animation: shooraTeaserPop 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: all 0.25s ease;
      z-index: 999998;
    }
    .shoora-widget-teaser:hover {
      transform: translateY(-2px);
      border-color: rgba(220, 185, 95, 0.85);
      box-shadow: 
        0 20px 42px -6px rgba(5, 16, 36, 0.6),
        0 6px 18px rgba(201, 168, 76, 0.35);
    }
    .shoora-teaser-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .shoora-teaser-advisor {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #ECC974;
      letter-spacing: 0.02em;
    }
    .shoora-teaser-online-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 6px #10B981;
    }
    .shoora-teaser-close {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .shoora-teaser-close:hover {
      background: rgba(255, 255, 255, 0.25);
      color: #FFFFFF;
    }
    .shoora-teaser-body {
      font-size: 12px;
      line-height: 1.45;
      color: #E2E8F0;
      font-weight: 400;
    }
    .shoora-teaser-body strong {
      color: #FFFFFF;
      font-weight: 600;
    }
    .shoora-teaser-arrow {
      position: absolute;
      bottom: -6px;
      ${isLeft ? 'left: 28px;' : 'right: 28px;'}
      width: 12px;
      height: 12px;
      background: #091e42;
      border-right: 1px solid rgba(220, 185, 95, 0.45);
      border-bottom: 1px solid rgba(220, 185, 95, 0.45);
      transform: rotate(45deg);
    }

    @keyframes shooraTeaserPop {
      0% {
        opacity: 0;
        transform: translateY(12px) scale(0.92);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .shoora-widget-iframe-container {
      position: fixed;
      bottom: 104px;
      ${isLeft ? 'left: 26px;' : 'right: 26px;'}
      width: 430px;
      height: 660px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 128px);
      border-radius: 24px;
      box-shadow: 
        0 24px 60px -8px rgba(5, 16, 36, 0.5),
        0 8px 24px rgba(201, 168, 76, 0.25),
        0 0 0 1px rgba(220, 185, 95, 0.35);
      background: #FAFAF7;
      overflow: hidden;
      z-index: 999998;
      display: none;
      transform-origin: ${isLeft ? 'bottom left' : 'bottom right'};
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .shoora-widget-iframe-container.shoora-open {
      display: block;
      animation: shooraSlideUp 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .shoora-widget-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
    @keyframes shooraSlideUp {
      from {
        opacity: 0;
        transform: translateY(24px) scale(0.94);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @media (max-width: 640px) {
      .shoora-widget-iframe-container {
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        max-width: 100vw !important;
        max-height: 100vh !important;
        border-radius: 0 !important;
        border: none !important;
      }
      .shoora-widget-teaser {
        width: calc(100vw - 48px);
        right: 12px !important;
        left: 12px !important;
      }
    }
  `;

  // Create Iframe Container
  const container = document.createElement('div');
  container.className = 'shoora-widget-iframe-container';
  container.id = 'shoora-widget-container';

  const iframe = document.createElement('iframe');
  iframe.className = 'shoora-widget-iframe';
  iframe.title = botTitle;
  iframe.src = `${hostUrl}/widget`;
  iframe.allow = 'clipboard-write';
  container.appendChild(iframe);

  // Create Floating Launcher Button
  const launcher = document.createElement('div');
  launcher.className = 'shoora-widget-launcher';
  launcher.id = 'shoora-widget-launcher';
  launcher.title = 'Chat with Shoora EB-5 AI Advisor';

  // Premium Multi-Layer SVG Icons (Modern AI Sparkle Chat Glyph)
  const chatIconSvg = `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shooraGoldGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FCEAB3"/>
          <stop offset="45%" stop-color="#ECC974"/>
          <stop offset="100%" stop-color="#C29432"/>
        </linearGradient>
      </defs>
      <!-- Chat Bubble Base with Gradient Fill & Outline -->
      <path d="M7 16.5C7 11.25 10.75 7.5 16 7.5C21.25 7.5 25 11.25 25 16.5C25 21.75 21.25 25.5 16 25.5C14.35 25.5 12.8 25.1 11.45 24.35L7.5 25.5L8.75 21.75C7.65 20.25 7 18.45 7 16.5Z" 
            fill="url(#shooraGoldGrad)" 
            fill-opacity="0.18"
            stroke="url(#shooraGoldGrad)" 
            stroke-width="2.2" 
            stroke-linecap="round" 
            stroke-linejoin="round"/>
      <!-- Inner Message Lines -->
      <line x1="12" y1="14" x2="20" y2="14" stroke="url(#shooraGoldGrad)" stroke-width="2" stroke-linecap="round"/>
      <line x1="12" y1="18.5" x2="17.5" y2="18.5" stroke="url(#shooraGoldGrad)" stroke-width="2" stroke-linecap="round"/>
      <!-- AI Sparkle Star -->
      <path d="M23.5 4.5L24.5 7.5L27.5 8.5L24.5 9.5L23.5 12.5L22.5 9.5L19.5 8.5L22.5 7.5L23.5 4.5Z" 
            fill="url(#shooraGoldGrad)"/>
    </svg>
  `;

  const closeIconSvg = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;

  launcher.innerHTML = `
    <div id="shoora-icon-wrapper" style="display:flex;align-items:center;justify-content:center;transition:transform 0.3s ease;">
      ${chatIconSvg}
    </div>
    <div class="shoora-widget-beacon">
      <div class="shoora-beacon-ring"></div>
      <div class="shoora-beacon-core"></div>
    </div>
  `;

  // Create Interactive Welcome Teaser Callout
  const teaser = document.createElement('div');
  teaser.className = 'shoora-widget-teaser';
  teaser.id = 'shoora-widget-teaser';
  teaser.innerHTML = `
    <div class="shoora-teaser-header">
      <div class="shoora-teaser-advisor">
        <span class="shoora-teaser-online-dot"></span>
        <span>Shoora EB-5 AI Advisor</span>
      </div>
      <button type="button" class="shoora-teaser-close" id="shoora-teaser-close-btn" title="Dismiss">✕</button>
    </div>
    <div class="shoora-teaser-body">
      Have questions on <strong>EB-5 Green Cards</strong>, investments, or wait times? Let's chat!
    </div>
    <div class="shoora-teaser-arrow"></div>
  `;

  // Interactive teaser click & dismiss handlers
  teaser.addEventListener('click', function (e) {
    if (e.target && (e.target.id === 'shoora-teaser-close-btn' || e.target.closest('#shoora-teaser-close-btn'))) {
      e.stopPropagation();
      teaser.style.opacity = '0';
      teaser.style.transform = 'translateY(10px) scale(0.92)';
      setTimeout(() => teaser.remove(), 250);
      return;
    }
    toggleWidget();
  });

  // Safe mounting function (handles script loading before DOM is ready)
  function mount() {
    if (!document.body) {
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', mount);
      } else {
        setTimeout(mount, 50);
      }
      return;
    }

    if (!document.getElementById('shoora-widget-styles')) {
      (document.head || document.body).appendChild(style);
    }
    if (!document.getElementById('shoora-widget-container')) {
      document.body.appendChild(container);
    }
    if (!document.getElementById('shoora-widget-teaser')) {
      document.body.appendChild(teaser);
    }
    if (!document.getElementById('shoora-widget-launcher')) {
      document.body.appendChild(launcher);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  let isOpen = false;

  function toggleWidget() {
    isOpen = !isOpen;
    const iconWrapper = document.getElementById('shoora-icon-wrapper');

    if (isOpen) {
      container.classList.add('shoora-open');
      if (iconWrapper) {
        iconWrapper.style.transform = 'rotate(90deg)';
        iconWrapper.innerHTML = closeIconSvg;
      }
      if (teaser && teaser.parentNode) {
        teaser.style.display = 'none';
      }
    } else {
      container.classList.remove('shoora-open');
      if (iconWrapper) {
        iconWrapper.style.transform = 'rotate(0deg)';
        iconWrapper.innerHTML = chatIconSvg;
      }
    }
  }

  launcher.addEventListener('click', toggleWidget);

  // Listen for close events posted from inside the iframe
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'shoora_close_widget') {
      if (isOpen) toggleWidget();
    } else if (e.data && e.data.type === 'shoora_open_widget') {
      if (!isOpen) toggleWidget();
    }
  });

  // Expose global controller
  window.ShooraEB5Widget = {
    open: function () {
      if (!isOpen) toggleWidget();
    },
    close: function () {
      if (isOpen) toggleWidget();
    },
    toggle: toggleWidget,
  };
})();
