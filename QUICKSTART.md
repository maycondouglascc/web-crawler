# Quick Start Guide — Multi-Width Web Crawler

Guia rápido para começar a usar os novos scripts de captura em múltiplas larguras.

## ⚡ Setup em 5 minutos

### 1. Terminal — Instalar dependências

```bash
# Navegar até a pasta
cd web-crawler

# Criar e ativar ambiente virtual
python -m venv venv
venv\Scripts\activate

# Instalar tudo
pip install -r requirements.txt
python -m playwright install
```

### 2. Criar arquivo de URLs

Crie um arquivo chamado `urls.txt` na pasta `web-crawler/`:

```
https://seu-site.com
https://seu-site.com/sobre
https://seu-site.com/contato
https://outro-site.com
```

**Uma URL por linha.** Sem comentários.

### 3. Executar script

#### Opção A: Screenshots em múltiplas larguras (RECOMENDADO)

```bash
python multi_width_crawler.py
```

Resultado: Pasta `screenshots_multi_width/` com subpastas por breakpoint.

#### Opção B: Screenshots + análise de conteúdo com AI

Primeiro, certifique-se de que Ollama está rodando:

```bash
# Em outro terminal:
ollama run llama3.2
```

Depois:

```bash
python multi_width_ai_crawler.py
```

Resultado: Screenshots + arquivo CSV com análise de conteúdo.

---

## 📊 Entender os resultados

### multi_width_crawler.py

Estrutura de saída:

```
screenshots_multi_width/
├── mobile/
│   ├── home_mobile.png
│   ├── sobre_mobile.png
│   └── ...
├── tablet/
│   ├── home_tablet.png
│   ├── sobre_tablet.png
│   └── ...
├── desktop/
├── ultrawide/
└── failed_urls.txt
```

**O que fazer com isso:**

- Comparar design responsivo lado a lado
- Verificar se layouts quebram em certos pontos
- Documentar problemas visuais por breakpoint

### multi_width_ai_crawler.py

Estrutura de saída:

```
local_audit_results_multi_width/
├── screenshots_mobile/
├── screenshots_tablet/
├── screenshots_desktop/
├── screenshots_ultrawide/
└── strategy_audit.csv    ← Abrir com Excel/Google Sheets
```

**CSV contém:**
| URL | Screenshots | Core Message | User Value | Tone | Audience | Grade |
|-----|-------------|--------------|-----------|------|----------|-------|
| seu-site.com | mobile, tablet... | Mensagem principal | Benefício | Profissional | Empresas | A |

---

## 🎯 Casos de uso

### "Quero testar design responsivo"

```bash
python multi_width_crawler.py
```

Depois, abra as pastas lado a lado (mobile vs desktop) para comparar layouts.

### "Quero auditar conteúdo de múltiplas páginas"

```bash
python multi_width_ai_crawler.py
```

Abra `strategy_audit.csv` para ver análise consolidada.

### "Quero testar só desktop ou só mobile"

Edite `multi_width_crawler.py`:

```python
# Comentar as larguras que não quer:
VIEWPORT_WIDTHS = {
    # "mobile": 375,
    # "tablet": 768,
    "desktop": 1024,
    # "ultrawide": 1920,
}
```

---

## 🔧 Customizações comuns

### Adicionar mais URLs

Simplesmente edite `urls.txt` e execute novamente.

### Mudar breakpoints

Edite em `multi_width_crawler.py`:

```python
VIEWPORT_WIDTHS = {
    "xs": 320,
    "sm": 640,
    "md": 768,
    "lg": 1024,
    "xl": 1280,
    "2xl": 1536,
}
```

### Aumentar tempo de carregamento

Se o site é lento, edite no script:

```python
page.wait_for_timeout(3000)  # de 1500 para 3000ms
```

### Usar modelo de AI diferente

Em `multi_width_ai_crawler.py`:

```python
MODEL_NAME = "mistral"  # tente: mistral, neural-chat, orca, etc
```

Primeiro faça download do modelo:

```bash
ollama pull mistral
ollama run mistral
```

---

## ❓ FAQs

**P: Qual script devo usar?**
R: Start com `multi_width_crawler.py`. Se precisa análise de conteúdo, use `multi_width_ai_crawler.py`.

**P: Quanto tempo leva?**
R: `multi_width_crawler.py` = ~5-10 segundos por URL (4 larguras).
`multi_width_ai_crawler.py` = ~20-30 segundos por URL (análise IA é mais lenta).

**P: Posso rodar enquanto trabalho?**
R: Sim, o navegador é headless (invisível). Você pode usar o computador normalmente.

**P: E se uma URL falhar?**
R: Continua nos scripts restantes. Falhas são salvas em `failed_urls.txt`.

**P: Posso capturar a mesma URL multiplas vezes?**
R: Sim, basta adicionar a URL múltiplas vezes em `urls.txt`.

---

## 📚 Próximos passos

1. **Teste básico:** Execute com 2-3 URLs para entender o fluxo
2. **Análise:** Abra as pastas de screenshots ou o CSV
3. **Customização:** Ajuste breakpoints conforme seu projeto
4. **Escala:** Adicione mais URLs e automatize com scripts shell/batch

---

## 🆘 Problemas comuns

| Problema                          | Solução                                         |
| --------------------------------- | ----------------------------------------------- |
| "Arquivo urls.txt não encontrado" | Crie arquivo na mesma pasta que o script        |
| "Connection refused" (Ollama)     | Execute `ollama serve` em outro terminal        |
| "Timeout conectando a URL"        | Aumente `timeout=30000` para `timeout=60000`    |
| "Chrome/Chromium não encontrado"  | Execute `python -m playwright install chromium` |

---

## 💡 Dica final

Para começar rapidinho, copie este arquivo `urls.txt` e execute:

```bash
echo https://google.com > urls.txt
python multi_width_crawler.py
```

Verá screenshots em 4 larguras em ~10 segundos! 🚀
