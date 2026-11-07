import backUrl from "../../assets/icons/back.svg";
import dismissUrl from "../../assets/icons/dismiss.svg";
import filterUrl from "../../assets/icons/filter.svg";
import refreshUrl from "../../assets/icons/refresh.svg";
import searchUrl from "../../assets/icons/search.svg";

const ICONS = {
  back: { src: backUrl, width: 24, height: 24 },
  dismiss: { src: dismissUrl, width: 24, height: 24 },
  filter: { src: filterUrl, width: 24, height: 24 },
  refresh: { src: refreshUrl, width: 25, height: 24 },
  search: { src: searchUrl, width: 24, height: 24 },
} as const;

export type FigmaIconName = keyof typeof ICONS;

export function FigmaIcon({ name }: { name: FigmaIconName }) {
  const icon = ICONS[name];
  return <img src={icon.src} alt="" width={icon.width} height={icon.height} draggable={false} />;
}
