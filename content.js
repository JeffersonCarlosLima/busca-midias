// content.js — varre a página em busca de links magnet:? e envia ao background (Manifest V3)
(function() {
  if (window.torrentSearchLoaded) return; // evita múltiplas execuções
  window.torrentSearchLoaded = true;

  try {
    const items = [];
    const links = document.querySelectorAll('a[href^="magnet:?"], a[href*="magnet:?"]');
    
    if (links.length === 0) {
      console.log('[Busca Torrent] Nenhum link magnet encontrado nesta página');
      return;
    }

    links.forEach((a, idx) => {
      try {
        const href = a.href;
        if (!href.startsWith('magnet:?')) {
          console.warn(`[Busca Torrent] Link ${idx} não é magnet válido`);
          return;
        }
        const q = href.split('?')[1] || '';
        const params = new URLSearchParams(q);
        const dn = params.get('dn') || '';
        items.push({ magnet: href, dn });
      } catch (e) {
        console.error(`[Busca Torrent] Erro processando link ${idx}:`, e.message);
      }
    });

    if (items.length) {
      console.log(`[Busca Torrent] ${items.length} magnet(s) encontrado(s)`);
      chrome.runtime.sendMessage(
        { type: 'found_magnets', items },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn('[Busca Torrent] Service worker não respondeu:', chrome.runtime.lastError.message);
          } else if (response) {
            console.log('[Busca Torrent] Magnets processados com sucesso');
          }
        }
      );
    }
  } catch (err) {
    console.error('[Busca Torrent] Erro geral:', err.message);
  }
})();
