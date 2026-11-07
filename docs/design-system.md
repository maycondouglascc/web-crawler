# Visual Intelligence Studio — Design System & Visual Language

Este documento é a referência canônica de **Design System** para designers, desenvolvedores e agentes de código que evoluem a interface do **Visual Intelligence Studio**.

A direção visual nasce da **Section 1 (`30:319`)** do arquivo Figma `nFHWQsVoLLCNDH3U37eBiq`:
- **Wireframe 1 (`29:2`)** — Primeiro crawl (`Start your first crawl`)
- **Wireframe 3 (`30:192`)** — Detalhe do site e galeria (`Site name`)
- **Wireframe 4 (`30:248`)** — Biblioteca de crawls (`My crawls`)

> Nota: O *Wireframe 2 (`30:66`)* explora uma variação sobre canvas `#1D1D1E` e não é a base adotada. A base canônica é o canvas `#131415`.

Os tokens vivem em `frontend/src/design/tokens.css`, expostos no Tailwind via `frontend/tailwind.config.js`, e os componentes primitivos residem em `frontend/src/components/ui/`. O catálogo interativo (estilo Storybook) pode ser inspecionado ao vivo em `#/docs` (`http://localhost:8000/#/docs`).

---

## 1. Princípios Visuais

1. **Canvas Contínuo, Sem Ruído**: A página é um plano contínuo (`#131415`). Regiões se separam por espaçamento (`40px`), não por linhas divisórias ou caixas aninhadas.
2. **Hierarquia por Profundidade (Card Afundado)**: O card (`#0C0D0D`) é mais escuro que o canvas (`#131415`), funcionando como um berço silencioso que destaca a captura de tela (`#1D1D1E`). Cards não usam borda nem sombra.
3. **Monocromia Intencional**: O produto é estritamente monocromático para não competir com as cores extraídas dos sites auditados. O branco (`#FFFFFF`) é reservado para texto primário e para a ação principal de cada tela.
4. **Dois Raios Estruturais**: Todo controle interativo (botão, input, chip, busca, mídia interna do card) tem raio `12px` (`rounded-control`). Todo container de bloco (card, modal, menu de filtro, barra de progresso) tem raio `24px` (`rounded-card`).
5. **Descoberta Guiada sem Clutter**: Filtros granulares ficam recolhidos no popover `Filter` (projetando *chips* dispensáveis apenas quando ativos), enquanto as categorias de artefatos extraídos (`Screens`, `Sections`, `Components`, `Modals`, `Tokens`) ficam visíveis com seus contadores na barra de ferramentas.

---

## 2. Design Tokens (`frontend/src/design/tokens.css`)

Os tokens dividem-se em **medidos (`figma`)** — extraídos diretamente dos três wireframes — e **expandidos (`expanded`)** — derivados da mesma escala neutra para cobrir modais, estados de foco/hover, formulários e erros.

### 2.1 Superfícies & Linhas

| Token CSS | Classe Tailwind | Valor | Origem | Papel Semântico |
| :--- | :--- | :--- | :--- | :--- |
| `--color-canvas` | `bg-canvas` | `#131415` | `figma` | Fundo principal da aplicação (Wireframes 1, 3 e 4). |
| `--color-sunken` | `bg-sunken` | `#0C0D0D` | `figma` | Superfície afundada de cards, blocos de rota e itens internos de modal. |
| `--color-media` | `bg-media` | `#1D1D1E` | `figma` | Moldura de preview da captura dentro do card (`aspect-[1440/1024]`). |
| `--color-surface` | `bg-surface` | `#242628` | `figma` | Fundo de campos de texto, campo de busca e hover de controles secundários. |
| `--color-chip` | `bg-chip` | `#252627` | `figma` | Fundo de chips de filtro ativos (`Desktop`, `Light`) e aba ativa. |
| `--color-line` | `border-line` | `#242628` | `figma` | Borda de `1px` em botões secundários, `IconButton`, chip outline e modais. |
| `--color-overlay-surface` | `bg-overlay-surface` | `#1D1D1E` | `expanded` | Superfície de modais e do menu flutuante `Filter`. |
| `--color-hover` | `bg-hover` | `#2C2E30` | `expanded` | Estado hover para superfícies já preenchidas. |
| `--color-line-strong` | `border-line-strong` | `#3A3C3E` | `expanded` | Divisor interno sobre superfícies escuras e thumb de scrollbar. |
| `--color-overlay` | `bg-black/72` | `rgba(0,0,0,0.72)` | `expanded` | Backdrop de modais e lightbox. |

### 2.2 Texto, Ação & Status

| Token CSS | Classe Tailwind | Valor | Origem | Papel Semântico |
| :--- | :--- | :--- | :--- | :--- |
| `--color-text` | `text-white` | `#FFFFFF` | `figma` | Títulos, corpo, labels de botões e valores digitados em inputs. |
| `--color-ink` | `text-ink` | `#262627` | `figma` | Texto escuro sobre botões primários brancos (`New crawl`, `Export images`). |
| `--color-muted` | `text-muted` | `#7E7E81` | `figma` | Subtítulo/resumo do site, metadados do card e placeholders de inputs. |
| `--color-subtle` | `text-subtle` | `#5C5C60` | `expanded` | URLs secundárias, dicas de atalhos de teclado e links discretos. |
| `--color-action` | `bg-action` | `#FFFFFF` | `figma` | Fundo do botão de ação primária. |
| `--color-action-hover` | `bg-action-hover` | `#E8E8E8` | `expanded` | Hover do botão primário branco. |
| `--color-danger` | `text-danger` / `bg-danger` | `#E5484D` | `expanded` | Exclusivo para estado de falha de crawl e barra de erro. |
| `--color-danger-muted` | `bg-danger-muted` | `#3A1D1F` | `expanded` | Fundo do ícone de alerta em caso de falha. |

---

## 3. Tipografia & Regras de Texto

- **Família Sans**: `Geist Sans` (`@fontsource/geist-sans`), pesos `400`, `500`, `600` e `700`.
- **Família Mono**: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` — restrita a valores técnicos copiáveis (códigos hexadecimais, propriedades CSS computadas).

| Token Tailwind | Tamanho / Linha | Peso | Origem | Aplicação |
| :--- | :--- | :--- | :--- | :--- |
| `text-display font-bold` | `32px` / `40px` | `700` | `figma` | Título principal de `My crawls` e `Site name` (1 por página). |
| `text-display font-semibold` | `32px` / `40px` | `600` | `figma` | Exclusivo para o título central `Start your first crawl`. |
| `text-body` | `16px` / `24px` | `400` | `figma` | Padrão universal: botões, inputs, chips, títulos de card, metadados e resumos. |
| `text-body font-bold` | `16px` / `24px` | `700` | `expanded` | Títulos de modal (`Modal`). |
| `text-label` | `13px` / `20px` | `500` | `expanded` | Labels de campos em modais, cabeçalhos de grupo no menu `Filter` e contadores secundários. |
| `text-caption` | `12px` / `16px` | `400` | `expanded` | Barra de dicas de teclado no rodapé do Lightbox. |

### Diretrizes de Microcopy
- **Sem caixa alta forçada (`uppercase`) ou `letter-spacing` expandido**: Toda a interface usa *sentence case* (`Start your first crawl`, `My crawls`, `Export design.md`, `Export images`).
- **Metadados de Card**: Até 3 itens por card em `text-body text-muted`, separados apenas por `gap-2` (`8px`), sem bullets (`•`) ou barras divisórias.
- **Botões de Texto vs. Botões de Ícone**: Botões de texto contêm apenas o verbo/substantivo da ação (`New crawl`, `Export design.md`, `Export images`, `Start capture`). Ícones ficam isolados em `IconButton` (ex.: recapturar, sessões autenticadas) ou em `Chip` (`Filter` e chips dispensáveis).

---

## 4. Layout, Grid & Espaçamento

### Escala de Espaçamento (`tokens.css`)
- **`6px` (`gap-1.5`)**: Medido exclusivamente entre o `TextField` grande de URL e o botão `New crawl` no *Wireframe 1*.
- **`8px` (`gap-2`)**: Entre botões de ação, entre chips de filtro, entre itens de metadado e entre o ícone de lupa e o input em `SearchField`.
- **`10px` (`gap-2.5`)**: Entre ícone e texto dentro de `Chip` (`Filter` e botão de remover filtro).
- **`12px` (`px-3`)**: Inset horizontal do bloco de texto dentro do `MediaCard`.
- **`16px` (`gap-4`)**: Entre o título da página e o resumo, e entre a imagem e o bloco de texto do card.
- **`24px` (`p-6` / `gap-6`)**: Padding interno do `MediaCard`, padding de `Modal` e gap da grade de 3 colunas.
- **`40px` (`gap-10`)**: Espaçamento vertical entre as regiões de uma página (`.page-frame`) e padding inferior.
- **`80px`**: Inset superior e lateral de `.page-frame` em viewports `>= 768px` (em mobile cai para `40px` topo e `24px` lateral).

### Alturas de Controles
- **Controle Grande (`56px` / `h-14`, `px-6`)**: Usado apenas na dupla `TextField` + `Button` da tela inicial (`Start your first crawl`).
- **Controle Padrão (`48px` / `h-12`, `px-4`)**: Usado em todos os demais botões, `IconButton`, `Chip`, `SearchField` e inputs de modal.

---

## 5. Catálogo de Componentes Primitivos (`frontend/src/components/ui/`)

- **`Button.tsx`**:
  - `variant="primary"` (`bg-action text-ink hover:bg-action-hover`) | `variant="secondary"` (`border border-line bg-transparent text-white hover:bg-surface`).
  - `size="default"` (`h-12 px-4`) | `size="large"` (`h-14 px-6`).
- **`IconButton.tsx`**:
  - Caixa de `48px` (`h-12 px-4 rounded-control border border-line`) com `aria-label` obrigatório.
- **`Chip.tsx`**:
  - `kind="outline"` (`border border-line bg-transparent hover:bg-surface`) para gatilhos (`Filter`) e toggles inativos.
  - `kind="filled"` (`bg-chip`) para filtros aplicados (com `onDismiss` renderizando o SVG `dismiss.svg`) ou toggles ativos.
- **`TextField.tsx` & `SearchField.tsx`**:
  - Fundo `bg-surface` (`#242628`), raio `12px`, texto `#FFFFFF`, placeholder `#7E7E81` (`placeholder:text-muted`) e anel de foco `focus-visible:ring-2`.
- **`MediaCard.tsx`**:
  - Container `rounded-card bg-sunken p-6` (`#0C0D0D`), área de mídia `aspect-[1440/1024] rounded-control bg-media` (`#1D1D1E`), `fit="cover"` para páginas completas (`object-cover object-top`) e `fit="contain"` para seções, modais e componentes.
- **`Modal.tsx`**:
  - Véu `bg-black/72`, caixa `rounded-card border border-line bg-overlay-surface`, cabeçalho com título `text-body font-bold` e descrição `text-label text-muted`, corpo rolável e rodapé com `border-t border-line`.
- **`FigmaIcon` (`icons.tsx`)**:
  - Renderiza os 5 SVGs originais exportados do Figma em `frontend/src/assets/icons/` (`back.svg`, `dismiss.svg`, `filter.svg`, `refresh.svg` [25×24], `search.svg`) preservando suas dimensões nativas.
