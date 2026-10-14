/**
 * Shoora EB-5 AI Chatbot — Production Embeddable Widget
 * 
 * Embed on any external website (HTML, WordPress, React, Vite, Webflow, Shopify):
 * <script src="https://YOUR-DOMAIN/widget.js" async></script>
 * 
 * Features:
 * - Zero external dependencies (Vanilla JS)
 * - Complete CSS isolation via Shadow DOM
 * - Responsive floating chat launcher & mobile drawer
 * - Open, minimize, and close controls
 * - Connects seamlessly to Shoora EB-5 AI backend, knowledge base, & CRM
 * - Global programmatic API: window.ShooraEB5Widget.open(), close(), toggle()
 */

(function () {
  'use strict';

  // Prevent multiple initializations on the same page
  if (window.__SHOORA_WIDGET_LOADED__) return;
  window.__SHOORA_WIDGET_LOADED__ = true;

  // Locate the script tag and extract origin & configuration
  const currentScript =
    document.currentScript ||
    document.querySelector('script[src*="widget.js"]') ||
    document.querySelector('script[data-shoora-widget]');

  let detectedOrigin = '';
  if (currentScript && currentScript.src) {
    try {
      const parsed = new URL(currentScript.src, window.location.href);
      detectedOrigin = parsed.origin;
    } catch (e) {
      // Fallback if URL parsing fails
    }
  }

  // Production fallback domain (replaces localhost in production)
  const productionFallback = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
    ? window.location.origin
    : 'https://chatbot-ebcc2.web.app';

  const hostUrl = (currentScript && currentScript.getAttribute('data-host')) || detectedOrigin || productionFallback;
  const position = (currentScript && currentScript.getAttribute('data-position')) || 'bottom-right';
  const botTitle = (currentScript && currentScript.getAttribute('data-title')) || 'Shoora EB-5 AI Advisor';
  const isLeft = position === 'bottom-left';

  // Create isolated Host Element
  const host = document.createElement('div');
  host.id = 'shoora-eb5-widget-root';
  host.setAttribute('aria-live', 'polite');
  host.style.all = 'initial';
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647'; // Highest possible z-index
  host.style.bottom = '0';
  if (isLeft) {
    host.style.left = '0';
  } else {
    host.style.right = '0';
  }
  host.style.width = '0';
  host.style.height = '0';
  host.style.overflow = 'visible';

  // Attach Shadow DOM for CSS isolation
  let shadowRoot;
  if (host.attachShadow) {
    try {
      shadowRoot = host.attachShadow({ mode: 'open' });
    } catch (err) {
      shadowRoot = host;
    }
  } else {
    shadowRoot = host;
  }

  // Scoped CSS styles injected only inside the Shadow DOM
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .shoora-launcher-btn {
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
      z-index: 2147483647;
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none;
      outline: none;
    }
    .shoora-launcher-btn:hover {
      transform: scale(1.08) translateY(-3px);
      box-shadow: 
        0 20px 42px -4px rgba(5, 16, 36, 0.65),
        0 8px 24px rgba(201, 168, 76, 0.55),
        inset 0 1.5px 2px rgba(255, 255, 255, 0.45);
      border-color: #f7df94;
    }
    .shoora-launcher-btn:active {
      transform: scale(0.96) translateY(0);
    }
    .shoora-launcher-btn:focus-visible {
      outline: 3px solid #ECC974;
      outline-offset: 4px;
    }

    /* Radar Beacon Status */
    .shoora-beacon {
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
    .shoora-teaser {
      position: fixed;
      bottom: 104px;
      ${isLeft ? 'left: 26px;' : 'right: 26px;'}
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
      z-index: 2147483646;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .shoora-teaser:hover {
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
    .shoora-teaser-dot {
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

    /* Floating Chat Panel Container */
    .shoora-panel {
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
      z-index: 2147483646;
      display: none;
      transform-origin: ${isLeft ? 'bottom left' : 'bottom right'};
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .shoora-panel.shoora-open {
      display: block;
      animation: shooraSlideUp 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .shoora-iframe {
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

    /* Mobile Responsive Viewport */
    @media (max-width: 640px) {
      .shoora-panel {
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
      .shoora-teaser {
        width: calc(100vw - 48px) !important;
        right: 12px !important;
        left: 12px !important;
      }
    }
  `;

  // Create Chatbot Iframe Panel
  const panel = document.createElement('div');
  panel.className = 'shoora-panel';
  panel.id = 'shoora-panel';

  const iframe = document.createElement('iframe');
  iframe.className = 'shoora-iframe';
  iframe.title = botTitle;
  iframe.src = `${hostUrl}/widget`;
  iframe.allow = 'clipboard-write; camera; microphone; autoplay';
  panel.appendChild(iframe);

  // SVG Icons
  const chatIconSvg = `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shooraGoldGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FCEAB3"/>
          <stop offset="45%" stop-color="#ECC974"/>
          <stop offset="100%" stop-color="#C29432"/>
        </linearGradient>
      </defs>
      <path d="M7 16.5C7 11.25 10.75 7.5 16 7.5C21.25 7.5 25 11.25 25 16.5C25 21.75 21.25 25.5 16 25.5C14.35 25.5 12.8 25.1 11.45 24.35L7.5 25.5L8.75 21.75C7.65 20.25 7 18.45 7 16.5Z" 
            fill="url(#shooraGoldGrad)" 
            fill-opacity="0.18"
            stroke="url(#shooraGoldGrad)" 
            stroke-width="2.2" 
            stroke-linecap="round" 
            stroke-linejoin="round"/>
      <line x1="12" y1="14" x2="20" y2="14" stroke="url(#shooraGoldGrad)" stroke-width="2" stroke-linecap="round"/>
      <line x1="12" y1="18.5" x2="17.5" y2="18.5" stroke="url(#shooraGoldGrad)" stroke-width="2" stroke-linecap="round"/>
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

  // Floating Launcher Button
  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'shoora-launcher-btn';
  launcher.id = 'shoora-launcher-btn';
  launcher.setAttribute('aria-label', 'Open Shoora EB-5 AI Advisor Chat');
  launcher.innerHTML = `
    <div id="shoora-icon-wrap" style="display:flex;align-items:center;justify-content:center;transition:transform 0.3s ease;">
      ${chatIconSvg}
    </div>
    <div class="shoora-beacon">
      <div class="shoora-beacon-ring"></div>
      <div class="shoora-beacon-core"></div>
    </div>
  `;

  // Interactive Teaser Card
  const teaser = document.createElement('div');
  teaser.className = 'shoora-teaser';
  teaser.id = 'shoora-teaser';
  teaser.innerHTML = `
    <div class="shoora-teaser-header">
      <div class="shoora-teaser-advisor">
        <span class="shoora-teaser-dot"></span>
        <span>Shoora EB-5 AI Advisor</span>
      </div>
      <button type="button" class="shoora-teaser-close" id="shoora-teaser-close-btn" title="Dismiss" aria-label="Dismiss teaser">✕</button>
    </div>
    <div class="shoora-teaser-body">
      Have questions on <strong>EB-5 Green Cards</strong>, investments, or wait times? Let's chat!
    </div>
    <div class="shoora-teaser-arrow"></div>
  `;

  // State Management
  let isOpen = false;

  function toggleWidget(forceState) {
    if (typeof forceState === 'boolean') {
      isOpen = forceState;
    } else {
      isOpen = !isOpen;
    }

    const iconWrap = shadowRoot.getElementById ? shadowRoot.getElementById('shoora-icon-wrap') : host.querySelector('#shoora-icon-wrap');

    if (isOpen) {
      panel.classList.add('shoora-open');
      launcher.setAttribute('aria-expanded', 'true');
      launcher.setAttribute('aria-label', 'Close Shoora EB-5 AI Advisor');
      if (iconWrap) {
        iconWrap.style.transform = 'rotate(90deg)';
        iconWrap.innerHTML = closeIconSvg;
      }
      if (teaser && teaser.parentNode) {
        teaser.style.display = 'none';
      }
    } else {
      panel.classList.remove('shoora-open');
      launcher.setAttribute('aria-expanded', 'false');
      launcher.setAttribute('aria-label', 'Open Shoora EB-5 AI Advisor');
      if (iconWrap) {
        iconWrap.style.transform = 'rotate(0deg)';
        iconWrap.innerHTML = chatIconSvg;
      }
    }
  }

  // Teaser Event Listeners
  teaser.addEventListener('click', function (e) {
    const target = e.target;
    if (target && (target.id === 'shoora-teaser-close-btn' || target.closest('#shoora-teaser-close-btn'))) {
      e.stopPropagation();
      teaser.style.opacity = '0';
      teaser.style.transform = 'translateY(10px) scale(0.92)';
      setTimeout(() => {
        if (teaser && teaser.parentNode) teaser.remove();
      }, 250);
      return;
    }
    toggleWidget(true);
  });

  launcher.addEventListener('click', () => toggleWidget());

  // Handle postMessages from inside the iframe (minimize, close, open)
  window.addEventListener('message', function (e) {
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.type === 'shoora_close_widget' || e.data.type === 'shoora_minimize_widget') {
      if (isOpen) toggleWidget(false);
    } else if (e.data.type === 'shoora_open_widget') {
      if (!isOpen) toggleWidget(true);
    }
  });

  // Safe DOM Mounting
  function mount() {
    if (!document.body) {
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', mount);
      } else {
        setTimeout(mount, 50);
      }
      return;
    }

    if (!document.getElementById('shoora-eb5-widget-root')) {
      shadowRoot.appendChild(style);
      shadowRoot.appendChild(panel);
      shadowRoot.appendChild(teaser);
      shadowRoot.appendChild(launcher);
      document.body.appendChild(host);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  // Public JavaScript API on the host page
  window.ShooraEB5Widget = {
    open: function () {
      if (!isOpen) toggleWidget(true);
    },
    close: function () {
      if (isOpen) toggleWidget(false);
    },
    minimize: function () {
      if (isOpen) toggleWidget(false);
    },
    toggle: function () {
      toggleWidget();
    },
    isOpen: function () {
      return isOpen;
    },
    version: '1.2.0',
    host: hostUrl
  };
})();
