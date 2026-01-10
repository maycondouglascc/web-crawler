# Web Crawler

Um projeto Python com dois scripts para rastreamento e captura de sites:

- **crawler.py**: Faz web crawl e gera um mapa do site agrupado por tipo de arquivo
- **visual_crawler.py**: Captura screenshots de uma lista de URLs

## 📋 Pré-requisitos

- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

## 🚀 Instalação

### 1. Clonar ou baixar o repositório

### 2. Criar ambiente virtual (opcional, mas recomendado)

### 3. Instalar dependências

```bash
pip install requests beautifulsoup4 playwright
```

### 4. Instalar navegadores do Playwright

```bash
python -m playwright install
```

## 📖 Uso

### Opção 1: Web Crawler (crawler.py)

Faz web scraping de um site e salva todos os links encontrados em um arquivo txt, agrupados por tipo de arquivo.

**Configuração:**

1. Abra `crawler.py`
2. Modifique a linha com a URL alvo:
   ```python
   target_site = "https://seu-site.com/"
   ```

**Executar:**

```bash
python crawler.py
```

**Output:**

- Arquivo `grouped_sitemap.txt` com os links encontrados, organizados por tipo (HTML, PDF, etc)

**Exemplo de uso:**

```bash
# Rastrear um site
python crawler.py
```

### Opção 2: Visual Crawler (visual_crawler.py)

Captura screenshots de uma lista de URLs em resolução 1920x1080.

**Configuração:**

1. Crie um arquivo chamado `FP_Trivent_Funds.txt` (ou altere `INPUT_FILE` no código)
2. Adicione uma URL por linha:
   ```
   https://exemplo1.com
   https://exemplo2.com
   https://exemplo3.com
   ```

**Executar:**

```bash
python visual_crawler.py
```

**Output:**

- Pasta `screenshots_from_list/` com as screenshots nomeadas numericamente
- Arquivo `failed_urls.txt` (se houver falhas) com URLs que não puderam ser capturadas

**Exemplo de uso:**

```bash
# Capturar screenshots de URLs
python visual_crawler.py
```

## ⚙️ Configurações Personalizadas

### crawler.py

```python
target_site = "https://seu-site.com/"  # Altere a URL aqui
```

### visual_crawler.py

```python
INPUT_FILE = "FP_Trivent_Funds.txt"    # Nome do arquivo com URLs
OUTPUT_DIR = "screenshots_from_list"   # Pasta onde salvar screenshots
```

Resolução do navegador pode ser alterada em:

```python
context = browser.new_context(viewport={"width": 1920, "height": 1080})
```

## 🛠️ Troubleshooting

**Erro: "Python não reconhecido"**

- Certifique-se de que Python está instalado e no PATH

**Erro: "No module named 'playwright'"**

- Execute: `pip install playwright`
- Execute: `python -m playwright install`

**Visual Crawler: Arquivo de entrada não encontrado**

- Crie o arquivo `FP_Trivent_Funds.txt` com uma URL por linha

**Navegador não inicia**

- Tente: `python -m playwright install chromium`

## 📝 Requisitos do Sistema

- Windows / macOS / Linux
- Mínimo 2GB RAM
- Espaço em disco para screenshots (varia conforme quantidade)

## 📄 Licença

Ver arquivo LICENSE para detalhes.

## 💡 Dicas

- Use o `crawler.py` para mapear sites grandes rapidamente
- Use o `visual_crawler.py` para auditorias visuais de múltiplas páginas
- Adicione delays maiores se o servidor for sensível a scraping
- Sempre respeite o `robots.txt` do site
