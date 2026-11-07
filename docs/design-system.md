# Linguagem visual do Studio

Este documento é a referência para evoluir a interface do Visual Intelligence Studio. Os valores medidos vêm do arquivo Figma `nFHWQsVoLLCNDH3U37eBiq`, seção **Section 1** (`30:319`):

- Wireframe 1, primeiro crawl (`29:2`)
- Wireframe 3, detalhe do site (`30:192`)
- Wireframe 4, lista de crawls (`30:248`)

O Wireframe 2 (`30:66`) repete o detalhe do site num canvas mais claro (`#1D1D1E` com cards `#141415`). Ele não é a base. A base é o canvas `#131415` da seção ligada.

A implementação vive em `frontend/src/design/tokens.css`. Os componentes em `frontend/src/components/ui/` consomem esses tokens pelo Tailwind. A mesma documentação abre ao vivo em `#/docs` (http://localhost:8000/#/docs com o Studio no ar). Não introduza hex novo numa tela. Se um caso não cabe num token, acrescente o token aqui e no CSS, com a marca `figma` ou `expanded`.

## O que o Figma define, e o que foi expandido

O Figma desenha três telas e quase nenhum estado. Ele fixa duas cores de texto, um punhado de superfícies, dois raios, dois tamanhos de texto e os espaços 6, 8, 10, 12, 16, 24, 40 e 80. Isso não cobre modal, formulário denso, erro, foco, progresso nem viewport estreita.

A expansão abaixo não cria uma segunda marca. Ela escurece ou clareia os neutros já medidos, e reserva uma única cor de status para destruição e falha. O verde anterior da interface saiu. O produto é monocromático.

## Princípios

1. A página é um canvas contínuo. Região se separa de região por espaço, não por linha.
2. O card é a única superfície afundada. Controles flutuam no canvas ou dentro do card, nunca os dois ao mesmo tempo com o mesmo preenchimento.
3. Texto de interface é 16/24. Título de página é 32/40. Qualquer outro tamanho é uma exceção nomeada neste documento.
4. Branco é ação primária e texto. Não existe cor de marca.
5. Um controle tem um raio de 12. Um card tem um raio de 24. Não misture.

## Cor

### Superfícies medidas

| Token | Valor | Uso |
| --- | --- | --- |
| `canvas` | `#131415` | Fundo da página. Wireframes 1, 3 e 4. |
| `sunken` | `#0C0D0D` | Card. É mais escuro que o canvas, não mais claro. |
| `surface` | `#242628` | Campo, busca, e a linha dos botões secundários. No Figma o preenchimento do campo e a borda do botão são o mesmo hex. |
| `chip` | `#252627` | Chip de filtro ativo (Desktop, Light). |
| `media` | `#1D1D1E` | Área da captura dentro do card, antes ou atrás da imagem. |

### Superfícies expandidas

| Token | Valor | Uso |
| --- | --- | --- |
| `overlay-surface` | `#1D1D1E` | Painel de filtro e modal, um degrau acima do canvas para separar do véu. |
| `hover` | `#2C2E30` | Hover de superfície quando o estado precisa de um preenchimento e não só de opacidade. |
| `overlay` | `rgba(0, 0, 0, 0.72)` | Véu atrás de modal e lightbox. |
| `line-strong` | `#3A3C3E` | Divisor interno quando `#242628` desaparece em cima de `surface`. |

`line` é `#242628`, o mesmo valor de `surface`. Use `border-line` em botão secundário, chip outline e modal. Não desenhe borda no card: o Figma não tem.

### Texto medido

| Token | Valor | Uso |
| --- | --- | --- |
| `text` | `#FFFFFF` | Título, corpo, rótulo de controle, placeholder. |
| `ink` | `#262627` | Texto sobre o botão primário branco. |
| `muted` | `#7E7E81` | Resumo da página e metadados do card. |

### Texto e status expandidos

| Token | Valor | Uso |
| --- | --- | --- |
| `subtle` | `#5C5C60` | URL completa, dica de teclado, texto que deve perder para o metadado. |
| `action` | `#FFFFFF` | Fundo do botão primário. |
| `action-hover` | `#E8E8E8` | Hover do botão primário. O Figma não desenha hover. |
| `danger` | `#E5484D` | Falha do crawl e a barra de progresso nesse estado. |
| `danger-muted` | `#3A1D1F` | Fundo do ícone de falha. |

Não use `danger` para categorizar arquivos, temas ou tipos de componente. Não reintroduza verde, âmbar ou índigo como acento de interface.

## Tipografia

Família: **Geist**, carregada como Geist Sans nos pesos 400, 500, 600 e 700.

| Estilo | Tamanho / linha | Peso | Origem | Onde entra |
| --- | --- | --- | --- | --- |
| Display | 32 / 40 | 700 | Figma, “My crawls” e “Site name” | Um por página, o nome da tela. |
| Display semibold | 32 / 40 | 600 | Figma, “Start your first crawl” | Só o título do estado vazio. |
| Body | 16 / 24 | 400 | Figma | Texto padrão: botão, campo, chip, título de card, metadado, resumo. |
| Body bold | 16 / 24 | 700 | Expandido | Título de modal. Um modal não compete com o título da página, então não sobe para 32. |
| Label | 13 / 20 | 500 | Expandido | Rótulo de campo dentro de modal, legenda curta sob um título de grupo, progresso secundário. |
| Caption | 12 / 16 | 400 | Expandido | Dica de teclado no lightbox. Não usar em card. |

Monoespacada é `ui-monospace` e só para um valor que a pessoa vai copiar e colar, como um estilo computado. Caminho de rota no card é Geist, não mono.

Não use caixa alta, tracking largo nem itálico. O Figma não tem eyebrow.

## Aplicação de texto

Escreva como as três telas escrevem: frase curta, sem ponto final em título, botão e chip.

- Título de página é uma linha. “My crawls”, “Start your first crawl”, ou o nome do site. Não anteponha ícone ao título.
- O resumo fica 16px abaixo do título, em `muted`, peso 400. Na tela de site o resumo é a URL. Não reescreva a URL como marketing.
- Título de card é o nome da página ou do crawl, branco, 16/24, peso 400. Não é bold.
- Metadados são uma fila horizontal, 8px entre itens, cor `muted`, o mesmo 16/24 do título. Três itens no máximo: no crawl, host, estado e data; na captura, viewport, tema e tamanho. Sem bullet, sem ponto médio, sem “•”.
- Placeholder usa a cor do texto, branco. “Enter an URL” e “Search” não ficam acinzentados.
- Botão usa o substantivo da ação: “New crawl”, “Export design.md”, “Export images”, “Start capture”. Sem ícone dentro do botão de texto. O ícone fica no botão que é só ícone.
- Chip de filtro ativo repete a palavra do filtro: “Desktop”, “Light”. O X remove o filtro, não navega.
- Mensagem vazia é uma frase só, em `muted`: “No crawls match this search.”, “Nothing matches these filters.”
- Número de progresso fica em body branco, “42%”, alinhado à direita do título do estado.

Hierarquia numa página, de cima para baixo: display, resumo muted, controles, conteúdo. Não insira um terceiro nível de título entre o display e os cards. Grupos dentro de uma ferramenta (revisão de rotas, modal) usam body branco como título de seção.

## Espaçamento

Escala usada. Os passos marcados como medidos aparecem no Figma. Os outros existem para a interface não inventar 7px ou 18px.

| Token | px | Origem |
| --- | --- | --- |
| `space-4` | 4 | Expandido. Folga mínima entre ícone de zoom e o vizinho quando 8 é largo demais. |
| `space-6` | 6 | Medido. Entre o campo e o botão “New crawl”. É o único 6 da interface. Não use em outra dupla. |
| `space-8` | 8 | Medido. Entre botões, entre chips, entre itens de metadado, entre ícone e palavra na busca. |
| `space-10` | 10 | Medido. Entre ícone e palavra dentro do chip Filter. |
| `space-12` | 12 | Medido. Padding horizontal do botão secundário, do chip e da busca. Inset do bloco de texto do card. |
| `space-16` | 16 | Medido. Entre título e resumo. Entre a imagem e o texto do card. Padding vertical do campo grande e do botão grande. |
| `space-24` | 24 | Medido. Padding do card. Gap da grade. Padding horizontal do campo grande e do botão grande. Gap entre grupos dentro de uma ferramenta. |
| `space-32` | 32 | Expandido. Gap da página quando a largura cai abaixo de 768px. |
| `space-40` | 40 | Medido. Entre regiões da página: voltar, cabeçalho, filtros, grade. Padding inferior da página. |
| `space-80` | 80 | Medido. Padding superior e lateral da página em 768px ou mais. |

### Página

A arte é 1440px de largura. O conteúdo útil é 1280px, porque o inset lateral é 80.

```
padding: 80px 80px 40px
gap entre regiões: 40px
max-width: 1440px, centralizado
```

Abaixo de 768px o inset lateral vai para 24px, o topo para 40px e o gap entre regiões para 32px. Tipo, raio e altura de controle não encolhem.

### Card

```
padding: 24px
gap entre mídia e texto: 16px
inset horizontal do texto: 12px
gap entre título e metadados: 8px
gap da grade: 24px
```

A mídia mantém a proporção 1440/1024, que é a proporção do frame no Figma.

### Controles

| Controle | Altura | Padding | Gap interno |
| --- | --- | --- | --- |
| Campo grande e botão “New crawl” | 56 | 24 × 16 | — |
| Botão, chip, busca, botão de ícone | 48 | 16 × 12 | 8 na busca, 10 no chip com ícone |
| Ícone sozinho (voltar) | 24 | 0 | — |
| Ícone de atualizar | 25 × 24 | dentro do botão de 48 | não esticar |

Alinhe uma fila de controles pelo centro. Alinhe o cabeçalho da página pelo topo, porque o título tem 40px de linha e o botão tem 48px de altura.

## Arredondamento

| Token | px | Onde |
| --- | --- | --- |
| `control` | 12 | Campo, botão, chip, busca, botão de ícone, mídia do card, painel não. |
| `card` | 24 | Card, modal, menu de filtro, estado vazio em bloco. |
| `full` | 999 | Só o polegar da barra de rolagem. A barra de progresso usa raio 12; com 8px de altura isso já lê como pílula, e não é um novo raio de componente. |

Não use pílula em chip, badge ou botão. O chip é um retângulo de 12.

Não arredonde o canvas nem a página.

## Foco, hover, desabilitado

O Figma não desenha esses estados. A expansão é esta:

- Foco visível: contorno branco de 2px, offset 2px. Vale para teclado. Não remova o contorno.
- Botão primário no hover: `#E8E8E8`.
- Botão secundário, chip outline e botão de ícone no hover: fundo `surface`.
- Desabilitado: opacidade 50%, sem troca de cor. Exportações ficam visíveis e desabilitadas até o crawl terminar, para o cabeçalho não pular.
- Seleção de texto: fundo branco, texto `ink`.

## Componentes

Os arquivos estão em `frontend/src/components/ui/`. Os ícones voltar, atualizar, filtrar, dispensar e buscar são os SVGs do Figma, com a largura e a altura originais (atualizar é 25×24, os outros são 24×24). Não os reescale com CSS.

### Botão

Dois variantes, dois tamanhos.

- **Primário** — fundo branco, texto `ink`. A ação principal da região: “New crawl”, “Export images”, “Start capture”.
- **Secundário** — sem fundo, borda `line`, texto branco. Ação ao lado da principal: “Export design.md”.
- **Grande** — 56px. Só a dupla campo + “New crawl”.
- **Padrão** — 48px. Todo o resto.

Um grupo tem um primário. O gap do grupo é 8, exceto a dupla do primeiro crawl, que é 6.

### Botão de ícone

Caixa de 48 com borda `line`, um ícone dentro, sem rótulo visível. O nome acessível vai em `aria-label`. No Figma ele é o controle de atualizar no detalhe do site. Também hospeda a sessão autenticada, que o wireframe não desenha: o ícone é uma chave de 24px, não um dos SVGs do Figma.

### Voltar

Não é um botão com caixa. É o ícone de 24px, sozinho, primeira região da página. No primeiro crawl ele só aparece se já existir crawl para onde voltar.

### Campo

Fundo `surface`, raio 12, texto e placeholder brancos, sem borda. O campo grande tem 56px de altura. O campo de modal tem 48px. Largura flexível. Não coloque ícone dentro do campo de URL. O ícone de busca vive só no campo de busca.

### Busca

Largura máxima 411px, altura 48, fundo `surface`, ícone e palavra com 8px, padding 16×12. Placeholder “Search”.

### Chip

Altura 48, raio 12, texto 16/24.

- **Outline** — borda `line`, sem fundo. É um botão. No Figma, “Filter”.
- **Filled** — fundo `chip`. No Figma, o filtro já aplicado, com o ícone de dispensar à direita e 10px entre a palavra e o ícone.

Filtro aplicado não é um botão de navegação. O X limpa aquele filtro. Na revisão de rotas o mesmo chip vira um toggle: filled significa incluído na captura, outline significa de fora, e não há X.

### Card de mídia

Fundo `sunken`, raio 24, padding 24. A imagem ocupa a largura interna na proporção 1440/1024, raio 12, fundo `media`. Captura de página usa `object-cover` alinhado ao topo. Seção, modal e componente usam `object-contain`. Abaixo, 16px, o bloco de texto com 12px de inset lateral: título branco e fila de metadados muted.

O card inteiro é o alvo do clique. Não coloque um segundo botão de “ver” por cima.

Sem borda, sem sombra, sem zoom no hover. O Figma não tem esses efeitos.

### Modal

Não existe no Figma. A expansão:

- Véu `overlay`.
- Caixa `overlay-surface`, raio 24, borda `line`, padding 24.
- Título em body bold. Descrição em label `muted`, 8px abaixo.
- Fechar é um ícone de 24 no canto, com nome acessível “Close”.
- Rodapé separado por `border-line`, ações à direita, gap 8.
- Campos internos usam o campo de 48px, com rótulo label 8px acima.

Cabe aqui: sessões, o pacote de exportação, a recaptura, o inspetor de componente.

### Menu de filtro

Não existe no Figma. Abre 8px abaixo do chip Filter. Caixa igual ao modal, sem véu, largura 280. Grupos com 16px entre si. Opção é texto 16/24: branco se escolhida, `muted` se não. Escolher uma opção não fecha o menu. Clicar fora fecha.

O que estiver diferente do padrão vira chip filled na fila, ao lado de Filter, gap 8. Padrões que não geram chip: conteúdo “Screens”, viewport “qualquer”, tema “qualquer”, captura “página inteira”.

### Barra de progresso

Card `sunken`, raio 24, padding 24. Título em body, detalhe em label muted. Porcentagem em body, à direita. Trilha de 8px no `canvas`, preenchimento branco, ou `danger` se o crawl falhou. Ícone de 24 dentro de uma caixa de 48 com borda `line`.

### Lightbox

Véu, caixa em `canvas` com raio 24. A imagem senta numa área `sunken`. Ferramentas são ícones de 24, gap 8, sem caixa, porque já estão numa barra. A dica de teclado é caption `subtle`.

## Páginas

### Primeiro crawl

Centro da viewport. Coluna de no máximo 800px, itens centrados, 24px entre o título e a fila do campo.

Título display semibold: “Start your first crawl”.
Fila: campo grande flexível, gap 6, botão grande primário “New crawl”.

Se a pessoa escolheu uma sessão no vault, um chip filled com o nome da sessão aparece 24px abaixo da fila. O X limpa a sessão.

Sessões ficam num botão de ícone no canto superior direito, no mesmo inset de 80px da página. Isso não está no wireframe. É o único controle fora da coluna, para o centro continuar igual ao Figma.

### My crawls

Frame de página. Título display bold à esquerda. À direita, na ordem: sessões, “New crawl”, busca. Gap 8. O “New crawl” não está no wireframe. Sem ele a lista não tem como começar o segundo crawl. Ele usa o botão primário padrão, não o grande.

Grade de cards. Título é o nome do site. Metadados: host, estado, data. Sem captura ainda, a área de mídia fica só na cor `media`.

Busca filtra por nome e por URL. Nenhum resultado é uma linha muted, não um card vazio.

### Site

Frame de página.

1. Ícone voltar.
2. Cabeçalho. Esquerda: nome do site em display bold, URL em body muted, 16px abaixo. Direita: atualizar, “Export design.md”, “Export images”, gap 8.
3. Progresso, só enquanto descobre, captura ou falha.
4. Revisão de rotas, quando a descoberta para para a pessoa escolher o que capturar.
5. Grade, quando existe captura.

“Export design.md” abre o pacote de arquivos do crawl. O primeiro é o `DESIGN_SYSTEM.md` do site capturado. “Export images” baixa o `gallery.html`. Atualizar abre a escolha de rotas para recapturar e só liga quando já existe captura.

Filtros e cards são a grade do Wireframe 3. O Figma mostra um único tipo de card. Seções, modais, componentes e tokens do crawl entram pelo menu Filter e aparecem como chip filled “Sections”, “Modals”, “Components” ou “Tokens”. A grade desses tipos reusa o mesmo card.

## O que não fazer

- Não voltar a paleta verde, slate e borda em todo card.
- Não reduzir metadado de card para 12px para “caber mais”.
- Não colocar ícone à esquerda do título de página.
- Não usar sombra para hierarquia. Hierarquia aqui é canvas, card afundado, superfície de controle.
- Não criar um raio entre 12 e 24.
- Não usar o gap de 6 fora da dupla campo + “New crawl”.
- Não esticar os SVGs do Figma. O de atualizar é 25px de largura de propósito.
- Não tratar o `DESIGN_SYSTEM.md` exportado de um crawl como este documento. Aquele arquivo descreve o site capturado. Este descreve o Studio.
