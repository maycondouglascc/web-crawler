# Web Crawler

Um projeto Python com scripts para rastreamento, captura de screenshots, análise de conteúdo e testes responsivos de sites.

## 📋 Scripts Disponíveis

- **crawler.py** — Web crawling e mapa do site (agrupado por tipo de arquivo)
- **visual_crawler.py** — Screenshots de uma lista de URLs em resolução fixa (1920x1080)
- **multi_width_crawler.py** — Screenshots em múltiplas larguras (mobile, tablet, desktop, ultrawide)
- **ai_crawler.py** — Screenshots + análise de conteúdo com IA local (Ollama)
- **multi_width_ai_crawler.py** — Screenshots em múltiplas larguras + análise de conteúdo com IA

## 🛠️ Pré-requisitos

- **Python 3.8 ou superior**
- **pip** (gerenciador de pacotes Python)
- **Ollama** (somente para scripts com análise AI) — [Download aqui](https://ollama.ai)

## 🚀 Instalação

### 1. Preparar o ambiente

```bash
# Navegar até a pasta do projeto
cd web-crawler

# Criar ambiente virtual (recomendado)
python -m venv venv

# Ativar ambiente virtual
# No Windows:
venv\Scripts\activate
# No macOS/Linux:
source venv/bin/activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Instalar navegadores do Playwright

```bash
python -m playwright install
```

### 4. (Opcional) Configurar Ollama para análise AI

Se pretende usar `ai_crawler.py` ou `multi_width_ai_crawler.py`:

```bash
# Baixar e instalar Ollama de: https://ollama.ai
# Executar um modelo (exemplo):
ollama run llama3.2
```

Deixe rodando em background (porta 11434). Os scripts conectarão automaticamente.

## 📖 Uso

## 📖 Uso

### 🏠 LOCAL SITE CAPTURE ⭐ (local_site_capture.py)

**Capture your local portfolio/dev site at multiple responsive widths!**

Perfect for testing responsive design while developing.

**Setup:**

```bash
# Terminal 1: Start your dev server
npm run dev

# Terminal 2: Run capture script
python local_site_capture.py
```

**Follow prompts:**

```
Enter port (default 5173): [Enter or type your port]
Which pages? / (then /about, /projects, etc)
```

**Output:**

```
local_screenshots_mobile/    (375px width)
local_screenshots_tablet/    (768px width)
local_screenshots_desktop/   (1024px width)
local_screenshots_ultrawide/ (1920px width)
```

Each page captured at all 4 widths for easy responsive design testing.

👉 **[Full guide: LOCAL_SITE_CAPTURE.md](LOCAL_SITE_CAPTURE.md)**

---

## 📖 Remote Site Scripts

### 2️⃣ Web Crawler (crawler.py)

Faz web scraping de um site e salva todos os links encontrados, agrupados por tipo de arquivo.

**Configuração:**

```python
target_site = "https://seu-site.com/"  # Altere a URL
```

**Executar:**

```bash
python crawler.py
```

**Output:**

- `grouped_sitemap.txt` — Links agrupados por tipo (HTML, PDF, etc)

---

### 3️⃣ Visual Crawler (visual_crawler.py)

Captura screenshots de URLs em **resolução fixa (1920x1080)**.

**Configuração:**

```python
INPUT_FILE = "urls.txt"                    # Nome do arquivo com URLs
OUTPUT_DIR = "screenshots_from_list"       # Pasta de saída
```

**Arquivo urls.txt:**

```
https://exemplo1.com
https://exemplo2.com/pagina
https://exemplo3.com
```

**Executar:**

```bash
python visual_crawler.py
```

**Output:**

- `screenshots_from_list/` — Screenshots nomeadas por URL
- `failed_urls.txt` — URLs que falharam (se houver)

---

### 4️⃣ Multi-Width Crawler ⭐ (multi_width_crawler.py)

**Novo!** Captura screenshots em **múltiplas larguras responsivas** (mobile, tablet, desktop, ultrawide).

**Configuração:**

```python
INPUT_FILE = "urls.txt"
OUTPUT_DIR = "screenshots_multi_width"
VIEWPORT_WIDTHS = {
    "mobile": 375,
    "tablet": 768,
    "desktop": 1024,
    "ultrawide": 1920,
}
```

**Executar:**

```bash
python multi_width_crawler.py
```

**Output:**

```
screenshots_multi_width/
├── mobile/        (375px width)
├── tablet/        (768px width)
├── desktop/       (1024px width)
├── ultrawide/     (1920px width)
└── failed_urls.txt
```

**Caso de uso:** Testar design responsivo capturando a mesma página em diferentes breakpoints.

---

### 5️⃣ AI Crawler (ai_crawler.py)

Captura screenshots em **resolução fixa** e **analisa conteúdo com IA local** (Ollama).

Requer: `ollama run llama3.2` (ou seu modelo preferido)

**Configuração:**

```python
INPUT_FILE = "urls.txt"
OUTPUT_DIR = "local_audit_results"
MODEL_NAME = "llama3.2"  # Altere conforme seu modelo
```

**Executar:**

```bash
python ai_crawler.py
```

**Output:**

- `local_audit_results/` — Screenshots
- `local_strategy_audit.csv` — Análise de conteúdo:
  - Core Message (valor principal)
  - User Value (benefício para usuário)
  - Tone (tom do conteúdo)
  - Audience (público-alvo)
  - Grade (A-F, clareza de mensagem)

---

### 6️⃣ Multi-Width AI Crawler ⭐ (multi_width_ai_crawler.py)

**Novo!** Combina multi-width + análise de conteúdo com IA.

Requer: `ollama run llama3.2` (ou seu modelo)

**Configuração:**

```python
INPUT_FILE = "urls.txt"
OUTPUT_DIR = "local_audit_results_multi_width"
VIEWPORT_WIDTHS = {
    "mobile": 375,
    "tablet": 768,
    "desktop": 1024,
    "ultrawide": 1920,
}
CAPTURE_WIDTHS = ["desktop"]  # Qual(is) largura(s) analisar
```

**Executar:**

```bash
python multi_width_ai_crawler.py
```

**Output:**

```
local_audit_results_multi_width/
├── screenshots_mobile/     (375px)
├── screenshots_tablet/     (768px)
├── screenshots_desktop/    (1024px)
├── screenshots_ultrawide/  (1920px)
└── strategy_audit.csv      (análise consolidada)
```

**Caso de uso:** Auditar conteúdo enquanto testa design responsivo. CSV contém uma linha por URL (não por width).

---

## ⚙️ Customização

### Adicionar/alterar larguras responsivas

Em `multi_width_crawler.py` ou `multi_width_ai_crawler.py`:

```python
VIEWPORT_WIDTHS = {
    "mobile_small": 320,
    "mobile": 375,
    "mobile_large": 425,
    "tablet": 768,
    "tablet_landscape": 1024,
    "laptop": 1440,
    "desktop": 1920,
}
```

### Alterar modelo de IA

```python
MODEL_NAME = "mistral"  # ou "llama3", "neural-chat", etc.
```

### Aumentar timeout para sites lentos

```python
page.goto(url, timeout=60000)  # 60 segundos
```

---

## 🛠️ Troubleshooting

| Erro                                   | Solução                                                  |
| -------------------------------------- | -------------------------------------------------------- |
| "No module named 'playwright'"         | `pip install playwright && python -m playwright install` |
| "No module named 'ollama'"             | `pip install ollama`                                     |
| "Ollama connection refused"            | `ollama serve` em outro terminal                         |
| "Arquivo urls.txt não encontrado"      | Crie o arquivo no mesmo diretório que o script           |
| "Failed to connect to localhost:11434" | Inicie Ollama: `ollama run llama3.2`                     |

---

## 💡 Dicas de Uso

- **Teste rápido?** Use `visual_crawler.py` (resolução única, mais rápido)
- **Design responsivo?** Use `multi_width_crawler.py`
- **Auditoria de conteúdo?** Use `ai_crawler.py`
- **Full audit?** Use `multi_width_ai_crawler.py` (mais lento, mais completo)
- **Primeiro acesso?** Comece com `visual_crawler.py` e 3-5 URLs

---

## 📝 Requisitos do Sistema

- Python 3.8+
- 2GB+ RAM
- Espaço em disco (~5-20MB por screenshot)
- Para AI: GPU recomendada (roda em CPU, mas mais lento)

## 📄 Licença

Ver arquivo LICENSE para detalhes.
