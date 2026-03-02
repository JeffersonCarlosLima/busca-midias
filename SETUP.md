# Configuração - Busca Mídias TMDB

## Problemas Corrigidos

✅ **Chave API inválida** - A chave anterior era um JWT, não uma chave de API válida  
✅ **Erro no botão "Copiar Magnet"** - Faltava passar o index do item  
✅ **Content script não era injetado** - Adicionado ao manifest.json  
✅ **Comunicação entre background e popup** - Melhorada com tratamento de erros  
✅ **Logging melhorado** - Agora mostra mensagens de debug no console  

---

## Como Configurar

### 1. Obter sua Chave API do TMDB

1. Acesse: https://www.themoviedb.org/settings/api
2. Crie uma conta (se não tiver)
3. Solicite uma API key (v3 auth)
4. Copie a chave (deve parecer com: `abc123def456ghi789jkl012mno345p`)

### 2. Inserir a Chave no Código

Abra `background.js` e substitua esta linha:

```javascript
const TMDB_API_KEY = 'SUA_CHAVE_TMDB_AQUI';
```

Por (exemplo):
```javascript
const TMDB_API_KEY = 'abc123def456ghi789jkl012mno345p';
```

### 3. Carregar a Extensão no Chrome

1. Abra: `chrome://extensions/`
2. Ative "Modo de desenvolvedor" (canto superior direito)
3. Clique "Carregar extensão sem empacotamento"
4. Selecione a pasta `busca-midias`

### 4. Testar

1. Visite um site com links magnet (ex: torrent sites)
2. Clique no ícone da extensão
3. Verifique se aparece uma lista com títulos e capas dos filmes

---

## Verificar Erros

Se não funcionar, verifique o console:

1. **No popup:** F12 → Inspecionar elemento → Console
2. **No background:** 
   - `chrome://extensions/` → Detalhes da extensão → "Visualizar o background web page"

Procure por mensagens com `[Busca Torrent]` para diagnóstico.

---

## O que a Extensão Faz

1. Detecta links `magnet:?` na página (content.js)
2. Envia para o background processar (background.js)
3. Processa títulos e busca no TMDB (API)
4. Exibe no popup com poster e metadados
5. Permite copiar o link magnet para o clipboard

---

## Estrutura do Projeto

```
busca-midias/
├── manifest.json       # Config da extensão (v3)
├── background.js       # Service worker - processa magnets
├── content.js          # Detecta links magnets na página
├── popup/
│   ├── index.html      # Interface
│   ├── app.js          # Lógica Vue.js
│   └── style.css       # Estilos
├── SETUP.md           # Este arquivo
└── README.md          # (opcional) documentação adicional
```

---

## Notas Técnicas

- **Manifest V3**: Usa service workers ao invés de background pages
- **Content Scripts**: Injetado automaticamente em todas as páginas
- **Comunicação**: Via `chrome.runtime.sendMessage()` com tratamento de erros
- **Vue.js**: Framework usado para reatividade no popup
- **TMDB API**: Busca de filme/série e obtenção de poster

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Nenhum magnet encontrado | Verifique se o site tem links `<a href="magnet:?...">` |
| Chave API não funciona | Verifique se a chave está correta em `background.js` |
| Popup vazio | Abra F12 e verifique console para erros |
| Botão "Copiar" não funciona | Verifique permissão `clipboardWrite` no manifest |
| Content script não executa | Recarregue a extensão em `chrome://extensions/` |

