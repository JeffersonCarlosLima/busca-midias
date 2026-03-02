// content.js — varre a página em busca de links magnet:? e envia ao background
(function() {
  try {
    const items = [];
    document.querySelectorAll('a[href^="magnet:?"]').forEach(a => {
      try {
        const href = a.href;
        const q = href.split('?')[1] || '';
        const params = new URLSearchParams(q);
        const dn = params.get('dn') || '';
        items.push({ magnet: href, dn });
      } catch (e) {
        // ignora link inválido
      }
    });

    if (items.length) {
      chrome.runtime.sendMessage({ type: 'found_magnets', items });
    }
  } catch (err) {
    // conteúdo protegido ou erro — não faz nada
  }
})();
