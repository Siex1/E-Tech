(() => {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('site-nav');
  const hero = document.getElementById('home');
  const topLink = document.querySelector('.back-to-top');
  const journey = document.querySelector('.permit-journey');
  const compactScreen = matchMedia('(max-width: 760px)');
  const desktopNavigation = matchMedia('(min-width: 1151px)');
  const links = nav ? [...nav.querySelectorAll('a[href^="#"]')] : [];
  const sections = links.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);

  function setMenu(open, returnFocus = false) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('open', open);
    if (returnFocus) toggle.focus();
  }
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  desktopNavigation.addEventListener('change', event => {
    const returnFocus = !event.matches && nav?.contains(document.activeElement);
    setMenu(false, returnFocus);
  });

  // Keep the full workflow readable without JavaScript; reduce the phone intro when enhanced.
  if (journey) {
    journey.open = !compactScreen.matches;
    compactScreen.addEventListener('change', event => { journey.open = !event.matches; });
    journey.addEventListener('toggle', requestUpdate);
  }

  // Moving to a section should also move keyboard focus out of the now-closed menu.
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      requestAnimationFrame(() => {
        const focusTarget = target.tagName === 'MAIN' ? target : target.querySelector('h1, h2, h3') || target;
        if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
        focusTarget.focus({ preventScroll: true });
        requestUpdate();
      });
    });
  });


  // Lightweight, keyboard-accessible page-preview tabs; no framework runtime.
  const tabList = document.querySelector('.showcase-tabs');
  if (tabList) {
    const tabs = [...tabList.querySelectorAll('[role="tab"]')];
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    const selectTab = (index, moveFocus = false) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      if (moveFocus) {
        tabs[index].focus({ preventScroll: true });
        tabs[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTab(index));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        selectTab(next, true);
      });
    });
    selectTab(0);
    tabList.hidden = false;
  }

  // Default to user acceptance; preserve both result sections without JavaScript.
  const resultsSection = document.getElementById('results');
  const resultsTabList = resultsSection?.querySelector('.results-tabs');
  if (resultsTabList) {
    const tabs = [...resultsTabList.querySelectorAll('[role="tab"]')];
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    const selectResult = (index, moveFocus = false) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      if (moveFocus) tabs[index].focus({ preventScroll: true });
    };
    panels.forEach((panel, i) => {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tabs[i].id);
      panel.tabIndex = 0;
    });
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectResult(index));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        selectResult(next, true);
      });
    });
    resultsSection.classList.add('results-switcher-enabled');
    selectResult(0);
    resultsTabList.hidden = false;
  }

  // Local interface screenshots open without changing the page or scroll position.
  const interfaceDialog = document.getElementById('interface-dialog');
  if (interfaceDialog && typeof interfaceDialog.showModal === 'function') {
    const previewImage = interfaceDialog.querySelector('.interface-dialog-image');
    const previewTitle = interfaceDialog.querySelector('h2');
    const previewCaption = interfaceDialog.querySelector('.interface-dialog-caption');
    const closePreview = interfaceDialog.querySelector('.interface-dialog-close');
    let previewTrigger;
    document.querySelectorAll('[data-interface-preview]').forEach(link => {
      link.setAttribute('aria-haspopup', 'dialog');
      link.setAttribute('aria-controls', 'interface-dialog');
      link.addEventListener('click', event => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const image = link.querySelector('img');
        previewTrigger = link;
        previewTitle.textContent = link.closest('.interface-row').querySelector('h4').textContent;
        previewCaption.textContent = link.closest('figure').querySelector('figcaption').textContent;
        previewImage.src = image.currentSrc || image.src;
        previewImage.alt = image.alt;
        interfaceDialog.showModal();
        document.documentElement.classList.add('interface-preview-open');
        closePreview.focus();
      });
    });
    closePreview.addEventListener('click', () => interfaceDialog.close());
    interfaceDialog.addEventListener('close', () => {
      document.documentElement.classList.remove('interface-preview-open');
      previewImage.removeAttribute('src');
      previewTrigger?.focus({ preventScroll: true });
    });
  }

  // Keep the layout useful if a replacement image has not been uploaded yet.
  document.querySelectorAll('img[data-placeholder]').forEach(img => {
    const recover = () => {
      const fallback = new URL(img.dataset.placeholder, document.baseURI).href;
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      if (img.src !== fallback) img.src = fallback;
    };
    img.addEventListener('error', recover);
    if (img.complete && !img.naturalWidth) recover();
  });

  let activeId;
  let scheduled = false;
  function updateView() {
    scheduled = false;
    const marker = Math.min(160, innerHeight * 0.25);
    let currentId = '';
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= marker) currentId = section.id;
      else break;
    }
    if (currentId !== activeId) {
      activeId = currentId;
      links.forEach(link => {
        if (link.hash === '#' + currentId) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    if (topLink && hero) {
      const passedIntro = hero.getBoundingClientRect().bottom < 100;
      topLink.hidden = !passedIntro && document.activeElement !== topLink;
    }
  }
  function requestUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateView);
  }
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate);
  addEventListener('hashchange', requestUpdate);
  addEventListener('load', requestUpdate);
  topLink?.addEventListener('blur', requestUpdate);
  document.fonts?.ready.then(requestUpdate);
  updateView();
})();
