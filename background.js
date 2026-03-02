// background.js — service worker (Manifest V3)
// Insira sua chave TMDB abaixo:
const TMDB_API_KEY = 'SUA_CHAVE_TMDB_AQUI'; // Substitua pela sua chave de API do TMDB

let storedItems = [];

// Função para limpar nomes de torrents e extrair título + ano aproximado
function parseTorrentName(name) {
  if (!name) return { title: '', year: null, cleaned: '' };
  let s = name;
  // Substitui separadores comuns por espaço
  s = s.replace(/[._\-\[]/g, ' ');
  // Remove conteúdo entre parênteses/colchetes
  s = s.replace(/\([^\)]*\)|\[[^\]]*\]/g, ' ');
  // Remove tags comuns de release/codec/qualidade
  s = s.replace(/\b(1080p|2160p|4k|3d|brrip|bluray|web[-._ ]dl|web[-._ ]rip|hdrip|x264|x265|h264|h265|hevc|dvdrip|dvdr|aac|ddp|dts|hdr|proper|limited|repack|yify|rarbg|ext|subs|remux)\b/ig, ' ');
  // Remove resolução e demais tokens
  s = s.replace(/\b(pp|p)\b/ig, ' ');
  // Extrai ano provável
  const yearMatch = s.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : null;
  // Remove pontos extras, múltiplos espaços e números residuais de release
  s = s.replace(/\b(S\d{1,2}E\d{1,2}|S\d{1,2})\b/ig, ' ');
  s = s.replace(/[^\w\s]/g, ' ');
  s = s.replace(/\s{2,}/g, ' ').trim();
  // Se sobrar algo como 'Movie.Title 2019', remove o ano do título
  let title = s;
  if (year) {
    title = title.replace(new RegExp('\\b' + year + '\\b'), '').replace(/\s{2,}/g, ' ').trim();
  }
  return { title: title, year: year, cleaned: s };
}

async function searchTMDB(title, year) {
  if (!title) return null;
  const base = 'https://api.themoviedb.org/3';
  const q = encodeURIComponent(title);
  try {
    // Primeiro tenta buscar como filme com ano (se disponível)
    let url = `${base}/search/movie?api_key=${TMDB_API_KEY}&query=${q}`;
    if (year) url += `&year=${year}`;
    let res = await fetch(url);
    if (!res.ok) throw new Error('TMDB fetch failed');
    let data = await res.json();
    if (data && data.results && data.results.length) {
      const pick = data.results[0];
      return {
        tmdb_title: pick.title || pick.name || '',
        tmdb_year: (pick.release_date || pick.first_air_date || '').slice(0,4) || year,
        poster: pick.poster_path ? `https://image.tmdb.org/t/p/w185${pick.poster_path}` : null,
        raw: pick
      };
    }

    // Fallback: search multi
    url = `${base}/search/multi?api_key=${TMDB_API_KEY}&query=${q}`;
    res = await fetch(url);
    if (!res.ok) throw new Error('TMDB fetch failed fallback');
    data = await res.json();
    if (data && data.results && data.results.length) {
      const pick = data.results[0];
      return {
        tmdb_title: pick.title || pick.name || '',
        tmdb_year: (pick.release_date || pick.first_air_date || '').slice(0,4) || year,
        poster: pick.poster_path ? `https://image.tmdb.org/t/p/w185${pick.poster_path}` : null,
        raw: pick
      };
    }
  } catch (e) {
    console.error('TMDB error', e);
  }
  return null;
}

async function processItems(items) {
  const out = [];
  for (const it of items) {
    const originalDn = it.dn || '';
    const parsed = parseTorrentName(decodeURIComponent(originalDn || ''));
    // Se dn estiver vazio, tenta extrair do magnet (nome após dn= não fornecido)
    let titleToSearch = parsed.title || '';
    if (!titleToSearch) {
      // tenta pegar após "magnet:?xt=urn:btih:...&dn=Title" — já tentou, mas se vazio, tenta heurística
      const m = it.magnet.match(/dn=([^&]+)/);
      if (m) titleToSearch = decodeURIComponent(m[1]).replace(/[._\-]/g, ' ');
    }
    const tmdb = await searchTMDB(titleToSearch, parsed.year);
    out.push({
      magnet: it.magnet,
      raw_name: originalDn,
      parsed_title: parsed.title,
      parsed_year: parsed.year,
      cleaned: parsed.cleaned,
      tmdb
    });
  }
  return out;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;
  
  if (message.type === 'found_magnets') {
    // recebe do content script, processa e armazena
    (async () => {
      try {
        const processed = await processItems(message.items || []);
        storedItems = processed;
        
        // Notifica o popup se estiver aberto
        chrome.runtime.sendMessage(
          { type: 'processed_magnets', items: storedItems },
          () => {
            // ignora erro se popup não está aberto
            if (chrome.runtime.lastError) {
              console.log('Popup não está aberto, mas magnets foram processados');
            }
          }
        );
        
        sendResponse({ success: true, processed: processed.length });
      } catch (e) {
        console.error('Erro processando magnets', e);
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true; // indica resposta assíncrona
  } else if (message.type === 'get_magnets') {
    sendResponse({ items: storedItems });
    return false;
  }
  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  storedItems = [];
});
