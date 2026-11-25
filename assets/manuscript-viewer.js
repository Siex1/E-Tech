(() => {
  const totalPages = 350;
  const params = new URLSearchParams(location.search);
  document.querySelector('.back-link').href = params.get('from') === 'links'
    ? 'index.html#links' : 'index.html#home';
  const viewport = document.querySelector('.document-viewport');
  const stack = document.querySelector('.manuscript-stack');
  const position = document.getElementById('page-position');
  const status = document.getElementById('reader-status');
  const records = new Map();
  const fragment = document.createDocumentFragment();
  for (let number = 1; number <= totalPages; number++) {
    const sheet = document.createElement('figure');
    sheet.className = 'manuscript-sheet';
    sheet.setAttribute('aria-label', `Manuscript page ${number} of ${totalPages}`);
    const placeholder = document.createElement('p');
    placeholder.className = 'page-placeholder';
    placeholder.textContent = `Page ${number}`;
    sheet.append(placeholder);
    records.set(sheet, { number, placeholder, visible: false, token: 0 });
    fragment.append(sheet);
  }
  stack.append(fragment);
  function release(sheet, record) {
    record.visible = false;
    record.token++;
    if (record.image) {
      record.image.onload = null;
      record.image.onerror = null;
      record.image.src = '';
      record.image = null;
    }
    const canvas = sheet.querySelector('canvas');
    if (canvas) { canvas.width = canvas.height = 0; canvas.remove(); }
    record.placeholder.hidden = false;
    record.placeholder.textContent = `Page ${record.number}`;
    sheet.removeAttribute('aria-busy');
  }
  function load(sheet, record) {
    if (record.visible) return;
    record.visible = true;
    const token = ++record.token;
    sheet.setAttribute('aria-busy', 'true');
    record.placeholder.hidden = false;
    record.placeholder.textContent = `Loading page ${record.number}.`;
    const image = new Image();
    record.image = image;
    image.onload = () => {
      if (!record.visible || record.token !== token) return;
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `e-Tech research manuscript, page ${record.number} of ${totalPages}`);
      canvas.getContext('2d').drawImage(image, 0, 0);
      canvas.addEventListener('contextmenu', event => event.preventDefault());
      canvas.addEventListener('dragstart', event => event.preventDefault());
      sheet.append(canvas);
      record.placeholder.hidden = true;
      record.image = null;
      sheet.setAttribute('aria-busy', 'false');
    };
    image.onerror = () => {
      if (!record.visible || record.token !== token) return;
      record.image = null;
      record.placeholder.textContent = `Page ${record.number} could not be loaded. Scroll away and back to try again.`;
      sheet.setAttribute('aria-busy', 'false');
    };
    // Only nearby watermarked images load. The original PDF is never requested.
    image.src = `assets/manuscript-pages/page-${String(record.number).padStart(3, '0')}.webp`;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const record = records.get(entry.target);
      if (entry.isIntersecting) load(entry.target, record);
      else release(entry.target, record);
    });
  }, { root: viewport, rootMargin: '1000px 0px' });
  records.forEach((record, sheet) => observer.observe(sheet));
  let scheduled = false;
  let current = 0;
  function updatePosition() {
    scheduled = false;
    const sheets = stack.children;
    const marker = viewport.getBoundingClientRect().top + Math.min(100, viewport.clientHeight / 4);
    let low = 0, high = sheets.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (sheets[middle].getBoundingClientRect().top <= marker) low = middle;
      else high = middle - 1;
    }
    const atEnd = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 2;
    const number = atEnd ? totalPages : low + 1;
    if (number !== current) {
      current = number;
      position.textContent = `Page ${number} of ${totalPages}`;
      status.textContent = `Page ${number} of ${totalPages}`;
    }
  }
  function schedulePosition() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updatePosition);
  }
  viewport.addEventListener('scroll', schedulePosition, { passive: true });
  addEventListener('resize', schedulePosition);
  updatePosition();
})();
