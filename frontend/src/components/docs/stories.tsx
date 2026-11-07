import React, { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { FIGMA_ICON_ASSETS, FigmaIcon, type FigmaIconName } from "../ui/icons";
import { IconButton } from "../ui/IconButton";
import { MediaCard } from "../ui/MediaCard";
import { Modal } from "../ui/Modal";
import { SearchField } from "../ui/SearchField";
import { TextField } from "../ui/TextField";

export type StoryId =
  | "overview"
  | "color"
  | "typography"
  | "spacing"
  | "radius"
  | "text"
  | "button"
  | "icon-button"
  | "text-field"
  | "search"
  | "chip"
  | "media-card"
  | "modal"
  | "icons";

export type StoryGroup = "Fundações" | "Componentes";

export type Story = {
  id: StoryId;
  group: StoryGroup;
  title: string;
  summary: string;
  canvas: React.ReactNode;
  docs: React.ReactNode;
};

const STORY_GROUPS: StoryGroup[] = ["Fundações", "Componentes"];

export function storyGroups(): StoryGroup[] {
  return STORY_GROUPS;
}

export function storyById(id: string): Story | undefined {
  return STORIES.find((story) => story.id === id);
}

export function storiesInGroup(group: StoryGroup): Story[] {
  return STORIES.filter((story) => story.group === group);
}

export const STORIES: Story[] = [
  {
    id: "overview",
    group: "Fundações",
    title: "Visão geral",
    summary: "A linguagem medida na Section 1 do Figma, mais o que foi preciso acrescentar para a interface existir.",
    canvas: <OverviewCanvas />,
    docs: (
      <Docs>
        <DocBlock title="De onde vem">
          <p>Arquivo Figma nFHWQsVoLLCNDH3U37eBiq, Section 1 (30:319). Wireframes 1, 3 e 4. O Wireframe 2 não é a base.</p>
          <p>Os valores vivem em frontend/src/design/tokens.css. Esta página mostra os mesmos componentes que o Studio usa.</p>
        </DocBlock>
        <DocBlock title="Regras">
          <p>A página é um canvas contínuo. Região se separa de região por espaço.</p>
          <p>O card é a única superfície afundada. O botão primário é branco. Não há cor de marca.</p>
          <p>Texto de interface é 16/24. Título de página é 32/40. Controle tem raio 12. Card tem raio 24.</p>
        </DocBlock>
      </Docs>
    ),
  },
  {
    id: "color",
    group: "Fundações",
    title: "Cor",
    summary: "Neutros medidos no Figma e os poucos tons acrescentados para hover, foco, modal e falha.",
    canvas: <ColorCanvas />,
    docs: (
      <Docs>
        <DocBlock title="Como aplicar">
          <p>canvas é o fundo da página. sunken é o card, mais escuro que o canvas. surface é campo, busca e a linha do botão secundário.</p>
          <p>chip é o filtro já aplicado. media é a área da captura. Texto sobre o botão branco usa ink.</p>
          <p>danger só marca falha. Não pinte arquivo, tema ou tipo de componente com ela.</p>
        </DocBlock>
        <Usage code={'className="bg-canvas text-white"\nclassName="bg-sunken"\nclassName="bg-surface text-muted"'} />
      </Docs>
    ),
  },
  {
    id: "typography",
    group: "Fundações",
    title: "Tipografia",
    summary: "Geist. Dois tamanhos medidos, 32/40 e 16/24, e dois tamanhos expandidos para modal e dica.",
    canvas: <TypeCanvas />,
    docs: (
      <Docs>
        <DocBlock title="Pesos">
          <p>Display bold é o título de My crawls e do site. Display semibold é só “Start your first crawl”.</p>
          <p>Body regular é o texto padrão, inclusive título de card e botão. Body bold é o título de modal.</p>
          <p>Label 13/20 e caption 12/16 não entram em card. Mono é só para um valor que a pessoa vai copiar.</p>
        </DocBlock>
        <Usage code={'<h1 className="text-display font-bold">My crawls</h1>\n<p className="text-body text-muted">Summary</p>\n<p className="text-label text-muted">Rótulo</p>'} />
      </Docs>
    ),
  },
  {
    id: "spacing",
    group: "Fundações",
    title: "Espaçamento",
    summary: "Os passos medidos no Figma e os dois passos acrescentados para a página não inventar medidas.",
    canvas: <SpacingCanvas />,
    docs: (
      <Docs>
        <DocBlock title="Onde cada passo entra">
          <p>6px existe uma vez: entre o campo e o botão New crawl. 8px separa botões, chips e metadados. 10px separa ícone e palavra no chip Filter.</p>
          <p>16px separa título e resumo, e a imagem do texto do card. 24px é o padding do card e o vão da grade. 40px separa regiões da página. 80px é o inset da página larga.</p>
          <p>Abaixo de 768px o inset lateral vai para 24px e o vão entre regiões para 32px. Tipo e raio não encolhem.</p>
        </DocBlock>
      </Docs>
    ),
  },
  {
    id: "radius",
    group: "Fundações",
    title: "Arredondamento",
    summary: "Dois raios. Controle e mídia usam 12. Card e modal usam 24.",
    canvas: <RadiusCanvas />,
    docs: (
      <Docs>
        <DocBlock title="Como aplicar">
          <p>Não crie um raio entre 12 e 24. Não use pílula em chip, botão ou badge.</p>
          <p>A barra de progresso tem 8px de altura e raio 12, então a ponta já lê como pílula. Isso não é um terceiro raio de componente.</p>
        </DocBlock>
        <Usage code={'className="rounded-control"\nclassName="rounded-card"'} />
      </Docs>
    ),
  },
  {
    id: "text",
    group: "Fundações",
    title: "Texto",
    summary: "Uma página tem um título, um resumo e cards. O metadado usa o mesmo tamanho do título do card.",
    canvas: <TextCanvas />,
    docs: (
      <Docs>
        <DocBlock title="Como escrever">
          <p>Título de página é uma linha, sem ícone na frente e sem ponto final. O resumo fica 16px abaixo, em muted.</p>
          <p>Título de card é branco, 16/24, peso regular. Metadados são uma fila com 8px entre itens, no mesmo tamanho, sem bullet.</p>
          <p>Placeholder é branco, a mesma cor do texto digitado. Botão nomeia a ação: New crawl, Export images, Start capture.</p>
        </DocBlock>
      </Docs>
    ),
  },
  {
    id: "button",
    group: "Componentes",
    title: "Button",
    summary: "Ação primária branca e ação secundária com linha. O tamanho grande só existe na dupla do primeiro crawl.",
    canvas: <ButtonCanvas />,
    docs: (
      <Docs>
        <DocBlock title="Anatomia">
          <p>Primário: fundo branco, texto ink. Secundário: sem fundo, borda line, texto branco. Altura padrão 48. Altura grande 56.</p>
          <p>Um grupo tem um primário. O vão do grupo é 8, exceto a dupla campo + New crawl, que é 6. Desabilitado fica em 50% de opacidade.</p>
        </DocBlock>
        <Usage code={'<Button>Export images</Button>\n<Button variant="secondary">Export design.md</Button>\n<Button size="large">New crawl</Button>'} />
      </Docs>
    ),
  },
  {
    id: "icon-button",
    group: "Componentes",
    title: "Icon button",
    summary: "Caixa de 48 com borda e um ícone. O nome acessível vai em aria-label.",
    canvas: <IconButtonCanvas />,
    docs: (
      <Docs>
        <DocBlock title="Anatomia">
          <p>No Figma ele é o controle de atualizar, com o ícone de 25×24. A sessão autenticada usa a mesma caixa com uma chave de 24, porque o wireframe não desenha esse controle.</p>
          <p>Voltar não usa esta caixa. Voltar é o ícone sozinho.</p>
        </DocBlock>
        <Usage code={'<IconButton label="Recapture pages">\n  <FigmaIcon name="refresh" />\n</IconButton>'} />
      </Docs>
    ),
  },
  {
    id: "text-field",
    group: "Componentes",
    title: "Text field",
    summary: "Campo sem borda, fundo surface, placeholder branco.",
    canvas: <TextFieldCanvas />,
    docs: (
      <Docs>
        <DocBlock title="Anatomia">
          <p>O campo grande tem 56px e padding 24×16. É o campo de URL. O campo de modal tem 48px. Não coloque ícone dentro do campo de URL.</p>
        </DocBlock>
        <Usage code={'<TextField placeholder="Enter an URL" />\n<TextField fieldSize="default" placeholder="Staging admin" />'} />
      </Docs>
    ),
  },
  {
    id: "search",
    group: "Componentes",
    title: "Search",
    summary: "Busca de 48px e 411px de largura, com o ícone do Figma e 8px até a palavra.",
    canvas: <SearchCanvas />,
    docs: (
      <Docs>
        <DocBlock title="Anatomia">
          <p>Placeholder “Search”, na cor do texto. Na lista de crawls ela fica na mesma linha do título. Abaixo de 1024px ela ocupa a largura da página.</p>
        </DocBlock>
        <Usage code={'<SearchField value={search} onChange={setSearch} />'} />
      </Docs>
    ),
  },
  {
    id: "chip",
    group: "Componentes",
    title: "Chip",
    summary: "Filtro em outline, filtro aplicado em filled com o ícone de dispensar.",
    canvas: <ChipCanvas />,
    docs: (
      <Docs>
        <DocBlock title="Anatomia">
          <p>Altura 48, raio 12, texto 16/24. Outline é um botão. Filled com onDismiss remove o filtro e não navega.</p>
          <p>Na revisão de rotas o mesmo chip é um toggle: filled significa incluído, outline significa de fora, e não há X.</p>
        </DocBlock>
        <Usage code={'<Chip label="Filter" icon={<FigmaIcon name="filter" />} onClick={open} />\n<Chip kind="filled" label="Desktop" onDismiss={clear} />'} />
      </Docs>
    ),
  },
  {
    id: "media-card",
    group: "Componentes",
    title: "Media card",
    summary: "Card afundado, raio 24, mídia na proporção 1440/1024.",
    canvas: <MediaCardCanvas />,
    docs: (
      <Docs>
        <DocBlock title="Anatomia">
          <p>Padding 24. 16px entre a mídia e o texto. O texto tem 12px de inset. Título branco e até três metadados muted, com 8px entre eles.</p>
          <p>Página usa object-cover alinhado ao topo. Seção, modal e componente usam object-contain. O card inteiro é o clique. Sem borda e sem sombra.</p>
        </DocBlock>
        <Usage code={'<MediaCard\n  title="/courses"\n  meta={["Desktop", "Light", "1440×1024"]}\n  imageUrl={url}\n  onClick={open}\n/>'} />
      </Docs>
    ),
  },
  {
    id: "modal",
    group: "Componentes",
    title: "Modal",
    summary: "Expansão. O Figma não desenha diálogo. A caixa usa a superfície elevada e o raio do card.",
    canvas: <ModalCanvas />,
    docs: (
      <Docs>
        <DocBlock title="Anatomia">
          <p>Véu escuro, caixa overlay-surface, raio 24, borda line, padding 24. O título é body bold para não competir com o título da página. A descrição é label muted.</p>
          <p>Cabe aqui: sessões, exportação, recaptura e o inspetor de componente.</p>
        </DocBlock>
        <Usage code={'<Modal title="Export design.md" description="..." onClose={close}>\n  {children}\n</Modal>'} />
      </Docs>
    ),
  },
  {
    id: "icons",
    group: "Componentes",
    title: "Ícones",
    summary: "Os cinco ícones do Figma, no tamanho original. Atualizar é 25×24. Os outros são 24×24.",
    canvas: <IconsCanvas />,
    docs: (
      <Docs>
        <DocBlock title="Como usar">
          <p>Não reescale esses SVGs com CSS. A largura e a altura do arquivo são as do frame.</p>
          <p>Ícones de zoom, fechar modal e chave de sessão não estão no Figma. Eles usam 24px para caber na mesma caixa.</p>
        </DocBlock>
        <Usage code={'<FigmaIcon name="back" />\n<FigmaIcon name="refresh" />'} />
      </Docs>
    ),
  },
];

function OverviewCanvas() {
  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-center text-display font-semibold text-white">Start your first crawl</h2>
      <div className="flex w-full max-w-[800px] items-center gap-1.5">
        <TextField placeholder="Enter an URL" className="flex-1" />
        <Button size="large">New crawl</Button>
      </div>
    </div>
  );
}

const COLOR_SWATCHES: Array<{ name: string; value: string; origin: "Figma" | "Expandido"; note: string }> = [
  { name: "canvas", value: "#131415", origin: "Figma", note: "Fundo da página" },
  { name: "sunken", value: "#0C0D0D", origin: "Figma", note: "Card" },
  { name: "surface", value: "#242628", origin: "Figma", note: "Campo e linha" },
  { name: "chip", value: "#252627", origin: "Figma", note: "Filtro ativo" },
  { name: "media", value: "#1D1D1E", origin: "Figma", note: "Área da captura" },
  { name: "overlay-surface", value: "#1D1D1E", origin: "Expandido", note: "Modal e menu" },
  { name: "hover", value: "#2C2E30", origin: "Expandido", note: "Hover de superfície" },
  { name: "text", value: "#FFFFFF", origin: "Figma", note: "Texto e placeholder" },
  { name: "ink", value: "#262627", origin: "Figma", note: "Texto no botão branco" },
  { name: "muted", value: "#7E7E81", origin: "Figma", note: "Resumo e metadado" },
  { name: "subtle", value: "#5C5C60", origin: "Expandido", note: "Dica e URL longa" },
  { name: "line", value: "#242628", origin: "Figma", note: "Borda de controle" },
  { name: "line-strong", value: "#3A3C3E", origin: "Expandido", note: "Divisor sobre surface" },
  { name: "action-hover", value: "#E8E8E8", origin: "Expandido", note: "Hover do primário" },
  { name: "danger", value: "#E5484D", origin: "Expandido", note: "Falha" },
  { name: "danger-muted", value: "#3A1D1F", origin: "Expandido", note: "Fundo do ícone de falha" },
];

function ColorCanvas() {
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {COLOR_SWATCHES.map((swatch) => (
        <div key={swatch.name} className="flex flex-col gap-4">
          <div className="h-16 rounded-control border border-line-strong" style={{ background: swatch.value }} />
          <div className="flex flex-col gap-2">
            <p className="text-body text-white">{swatch.name}</p>
            <p className="text-body text-muted">{swatch.value}</p>
            <p className="text-caption text-subtle">
              {swatch.origin} · {swatch.note}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TypeCanvas() {
  return (
    <div className="flex flex-col gap-8">
      <TypeRow name="Display bold" meta="32 / 40 · 700 · Figma" className="text-display font-bold text-white">
        My crawls
      </TypeRow>
      <TypeRow name="Display semibold" meta="32 / 40 · 600 · Figma" className="text-display font-semibold text-white">
        Start your first crawl
      </TypeRow>
      <TypeRow name="Body" meta="16 / 24 · 400 · Figma" className="text-body text-white">
        Export design.md
      </TypeRow>
      <TypeRow name="Body muted" meta="16 / 24 · 400 · Figma" className="text-body text-muted">
        Summary about the site
      </TypeRow>
      <TypeRow name="Body bold" meta="16 / 24 · 700 · Expandido" className="text-body font-bold text-white">
        Título de modal
      </TypeRow>
      <TypeRow name="Label" meta="13 / 20 · 500 · Expandido" className="text-label text-muted">
        Rótulo de campo dentro de modal
      </TypeRow>
      <TypeRow name="Caption" meta="12 / 16 · 400 · Expandido" className="text-caption text-subtle">
        Arrow keys move. Escape closes.
      </TypeRow>
    </div>
  );
}

function TypeRow({ name, meta, className, children }: { name: string; meta: string; className: string; children: string }) {
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <p className="text-caption text-subtle">
        {name} · {meta}
      </p>
      <p className={className}>{children}</p>
    </div>
  );
}

const SPACES: Array<{ token: string; px: number; origin: "Figma" | "Expandido" }> = [
  { token: "space-4", px: 4, origin: "Expandido" },
  { token: "space-6", px: 6, origin: "Figma" },
  { token: "space-8", px: 8, origin: "Figma" },
  { token: "space-10", px: 10, origin: "Figma" },
  { token: "space-12", px: 12, origin: "Figma" },
  { token: "space-16", px: 16, origin: "Figma" },
  { token: "space-24", px: 24, origin: "Figma" },
  { token: "space-32", px: 32, origin: "Expandido" },
  { token: "space-40", px: 40, origin: "Figma" },
  { token: "space-80", px: 80, origin: "Figma" },
];

function SpacingCanvas() {
  return (
    <div className="flex flex-col gap-4">
      {SPACES.map((space) => (
        <div key={space.token} className="flex items-center gap-4">
          <div className="h-3 rounded-control bg-white" style={{ width: space.px }} />
          <p className="text-body text-white">{space.token}</p>
          <p className="text-body text-muted">{space.px}px</p>
          <p className="text-caption text-subtle">{space.origin}</p>
        </div>
      ))}
    </div>
  );
}

function RadiusCanvas() {
  return (
    <div className="flex flex-wrap gap-6">
      <div className="flex flex-col gap-4">
        <div className="h-24 w-24 rounded-control border border-white" />
        <p className="text-body text-white">control</p>
        <p className="text-body text-muted">12px</p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="h-24 w-24 rounded-card border border-white" />
        <p className="text-body text-white">card</p>
        <p className="text-body text-muted">24px</p>
      </div>
    </div>
  );
}

function TextCanvas() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <h2 className="text-display font-bold text-white">Site name</h2>
        <p className="text-body text-muted">https://acedia.lms</p>
      </div>
      <div className="max-w-sm">
        <MediaCard title="/courses" meta={["Desktop", "Light", "1440×1024"]} />
      </div>
    </div>
  );
}

function ButtonCanvas() {
  const [size, setSize] = useState<"default" | "large">("default");
  const [disabled, setDisabled] = useState(false);
  return (
    <div className="flex flex-col gap-8">
      <Controls>
        <Chip label="Default" kind={size === "default" ? "filled" : "outline"} onClick={() => setSize("default")} />
        <Chip label="Large" kind={size === "large" ? "filled" : "outline"} onClick={() => setSize("large")} />
        <Chip label="Disabled" kind={disabled ? "filled" : "outline"} onClick={() => setDisabled((value) => !value)} />
      </Controls>
      <div className="flex flex-wrap items-center gap-2">
        <Button size={size} disabled={disabled}>
          New crawl
        </Button>
        <Button variant="secondary" size={size} disabled={disabled}>
          Export design.md
        </Button>
      </div>
    </div>
  );
}

function IconButtonCanvas() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex flex-col items-start gap-4">
        <IconButton label="Recapture pages">
          <FigmaIcon name="refresh" />
        </IconButton>
        <p className="text-caption text-subtle">Atualizar · 25×24</p>
      </div>
      <div className="flex flex-col items-start gap-4">
        <IconButton label="Authenticated sessions">
          <KeyRound size={24} />
        </IconButton>
        <p className="text-caption text-subtle">Sessão · expandido</p>
      </div>
      <div className="flex flex-col items-start gap-4">
        <button type="button" aria-label="Back" className="inline-flex">
          <FigmaIcon name="back" />
        </button>
        <p className="text-caption text-subtle">Voltar · sem caixa</p>
      </div>
    </div>
  );
}

function TextFieldCanvas() {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  return (
    <div className="flex max-w-[800px] flex-col gap-6">
      <TextField placeholder="Enter an URL" value={url} onChange={(event) => setUrl(event.target.value)} />
      <TextField fieldSize="default" placeholder="Staging admin" value={label} onChange={(event) => setLabel(event.target.value)} />
    </div>
  );
}

function SearchCanvas() {
  const [value, setValue] = useState("");
  return <SearchField value={value} onChange={setValue} />;
}

function ChipCanvas() {
  const [filters, setFilters] = useState<string[]>(["Desktop", "Light"]);
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-2">
        <Chip label="Filter" kind="outline" icon={<FigmaIcon name="filter" />} onClick={() => undefined} />
        {filters.map((filter) => (
          <Chip
            key={filter}
            kind="filled"
            label={filter}
            onDismiss={() => setFilters((current) => current.filter((item) => item !== filter))}
          />
        ))}
      </div>
      {filters.length === 0 && (
        <Button variant="secondary" onClick={() => setFilters(["Desktop", "Light"])}>
          Restore filters
        </Button>
      )}
    </div>
  );
}

function MediaCardCanvas() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <MediaCard title="/courses" meta={["Desktop", "Light", "1440×1024"]} onClick={() => undefined} />
      <MediaCard title="Hero" meta={["/", "Desktop", "Dark"]} fit="contain" onClick={() => undefined} />
    </div>
  );
}

function ModalCanvas() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      {open && (
        <Modal
          title="Export design.md"
          description="O arquivo de design é a auditoria do site capturado."
          onClose={() => setOpen(false)}
          footer={
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Done
            </Button>
          }
        >
          <p className="text-body text-muted">O título do modal fica em 16/24 bold. A página por baixo continua com o título de 32.</p>
        </Modal>
      )}
    </div>
  );
}

function IconsCanvas() {
  const names = Object.keys(FIGMA_ICON_ASSETS) as FigmaIconName[];
  return (
    <div className="flex flex-wrap gap-6">
      {names.map((name) => {
        const asset = FIGMA_ICON_ASSETS[name];
        return (
          <div key={name} className="flex w-28 flex-col items-start gap-4">
            <div className="flex h-12 items-center">
              <FigmaIcon name={name} />
            </div>
            <p className="text-body text-white">{name}</p>
            <p className="text-caption text-subtle">
              {asset.width}×{asset.height}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function Controls({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-caption text-subtle">Controls</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Docs({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-10">{children}</div>;
}

function DocBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex max-w-3xl flex-col gap-4">
      <h3 className="text-body font-bold text-white">{title}</h3>
      <div className="flex flex-col gap-2 text-body text-muted">{children}</div>
    </section>
  );
}

function Usage({ code }: { code: string }) {
  return (
    <section className="flex max-w-3xl flex-col gap-4">
      <h3 className="text-body font-bold text-white">Uso</h3>
      <pre className="overflow-x-auto rounded-control bg-sunken p-4 font-mono text-caption text-white">{code}</pre>
    </section>
  );
}
