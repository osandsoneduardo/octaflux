import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BlockRenderer } from "./BlockRenderer";
import type { Block, SiteTheme } from "@/lib/blocks";
import { Trash2, Copy, ArrowUp, ArrowDown, RotateCw } from "lucide-react";

export type FreeBlock = Block & {
  x: number | null;
  y: number | null;
  w: number | null;
  h: number | null;
  rotation: number | null;
  z_index: number | null;
};

type Props = {
  blocks: FreeBlock[];
  theme: SiteTheme;
  ownerSlug?: string;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<FreeBlock>) => void;
  onCommit: (id: string, patch: Partial<FreeBlock>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onZ: (id: string, dir: "front" | "back" | "fwd" | "bwd") => void;
};

const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
type HandleDir = (typeof HANDLES)[number];
const SNAP = 8;
const SNAP_THRESHOLD = 6; // px de tolerância para snap a outros blocos

function snapGrid(v: number) {
  return Math.round(v / SNAP) * SNAP;
}

const DEFAULTS = { x: 40, y: 40, w: 320, h: 200 };

// Snap a outros blocos: alinha bordas (left/right/center) e (top/bottom/middle)
function snapToBlocks(
  x: number, y: number, w: number, h: number,
  others: FreeBlock[]
): { x: number; y: number; vGuide: number | null; hGuide: number | null } {
  let bestX = x, bestY = y;
  let vGuide: number | null = null, hGuide: number | null = null;
  let bestDX = SNAP_THRESHOLD, bestDY = SNAP_THRESHOLD;

  const candidatesX = [x, x + w / 2, x + w];
  const candidatesY = [y, y + h / 2, y + h];

  for (const o of others) {
    const ox = o.x ?? DEFAULTS.x, oy = o.y ?? DEFAULTS.y;
    const ow = o.w ?? DEFAULTS.w, oh = o.h ?? DEFAULTS.h;
    const targetsX = [ox, ox + ow / 2, ox + ow];
    const targetsY = [oy, oy + oh / 2, oy + oh];

    for (let i = 0; i < candidatesX.length; i++) {
      for (const t of targetsX) {
        const d = Math.abs(candidatesX[i] - t);
        if (d < bestDX) {
          bestDX = d;
          bestX = x + (t - candidatesX[i]);
          vGuide = t;
        }
      }
    }
    for (let i = 0; i < candidatesY.length; i++) {
      for (const t of targetsY) {
        const d = Math.abs(candidatesY[i] - t);
        if (d < bestDY) {
          bestDY = d;
          bestY = y + (t - candidatesY[i]);
          hGuide = t;
        }
      }
    }
  }

  return { x: bestX, y: bestY, vGuide, hGuide };
}

// Quais blocos suportam edição inline e qual prop edita
function inlineProp(blockType: string): string | null {
  switch (blockType) {
    case "text": return "content";
    case "hero": return "title";
    case "heading": return "text";
    case "paragraph": return "content";
    default: return null;
  }
}

export function FreeCanvas({
  blocks, theme, ownerSlug, canvasWidth, canvasHeight, zoom,
  selectedId, onSelect, onChange, onCommit, onDelete, onDuplicate, onZ,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<
    | { kind: "move"; id: string; startX: number; startY: number; origX: number; origY: number }
    | { kind: "resize"; id: string; dir: HandleDir; startX: number; startY: number; orig: { x: number; y: number; w: number; h: number } }
    | { kind: "rotate"; id: string; centerX: number; centerY: number; startAngle: number; origRotation: number }
    | null
  >(null);
  const [guides, setGuides] = useState<{ v: number | null; h: number | null }>({ v: null, h: null });
  const [editingId, setEditingId] = useState<string | null>(null);

  const getBlock = (id: string) => blocks.find((b) => b.id === id);

  const onPointerDownBlock = (e: React.PointerEvent, b: FreeBlock) => {
    if ((e.target as HTMLElement).closest("[data-handle]")) return;
    if (editingId === b.id) return; // não arrasta enquanto edita
    e.stopPropagation();
    onSelect(b.id);
    setDrag({
      kind: "move",
      id: b.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: b.x ?? DEFAULTS.x,
      origY: b.y ?? DEFAULTS.y,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onDoubleClickBlock = (b: FreeBlock) => {
    if (inlineProp(b.block_type)) {
      onSelect(b.id);
      setEditingId(b.id);
    }
  };

  const onPointerDownHandle = (e: React.PointerEvent, b: FreeBlock, dir: HandleDir) => {
    e.stopPropagation();
    onSelect(b.id);
    setDrag({
      kind: "resize",
      id: b.id,
      dir,
      startX: e.clientX,
      startY: e.clientY,
      orig: { x: b.x ?? DEFAULTS.x, y: b.y ?? DEFAULTS.y, w: b.w ?? DEFAULTS.w, h: b.h ?? DEFAULTS.h },
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerDownRotate = (e: React.PointerEvent, b: FreeBlock) => {
    e.stopPropagation();
    onSelect(b.id);
    const rect = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-block-id]")?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setDrag({
      kind: "rotate",
      id: b.id,
      centerX: cx,
      centerY: cy,
      startAngle: Math.atan2(e.clientY - cy, e.clientX - cx),
      origRotation: b.rotation ?? 0,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!drag) return;
      const b = getBlock(drag.id);
      if (!b) return;

      if (drag.kind === "rotate") {
        const angle = Math.atan2(e.clientY - drag.centerY, e.clientX - drag.centerX);
        let deg = drag.origRotation + ((angle - drag.startAngle) * 180) / Math.PI;
        // Snap a múltiplos de 15° quando shift está pressionado
        if (e.shiftKey) deg = Math.round(deg / 15) * 15;
        onChange(drag.id, { rotation: Math.round(deg) });
        return;
      }

      const dx = (e.clientX - drag.startX) / zoom;
      const dy = (e.clientY - drag.startY) / zoom;

      if (drag.kind === "move") {
        let nx = snapGrid(drag.origX + dx);
        let ny = snapGrid(drag.origY + dy);
        const w = b.w ?? DEFAULTS.w, h = b.h ?? DEFAULTS.h;

        // Snap a outros blocos (com prioridade sobre grid)
        const others = blocks.filter((x) => x.id !== drag.id);
        const sn = snapToBlocks(nx, ny, w, h, others);
        nx = sn.x; ny = sn.y;
        setGuides({ v: sn.vGuide, h: sn.hGuide });

        nx = Math.max(0, Math.min(canvasWidth - w, nx));
        ny = Math.max(0, Math.min(canvasHeight - h, ny));
        onChange(drag.id, { x: nx, y: ny });
      } else {
        const { x, y, w, h } = drag.orig;
        let nx = x, ny = y, nw = w, nh = h;
        const minW = 40, minH = 30;
        if (drag.dir.includes("e")) nw = Math.max(minW, w + dx);
        if (drag.dir.includes("s")) nh = Math.max(minH, h + dy);
        if (drag.dir.includes("w")) {
          const newW = Math.max(minW, w - dx);
          nx = x + (w - newW); nw = newW;
        }
        if (drag.dir.includes("n")) {
          const newH = Math.max(minH, h - dy);
          ny = y + (h - newH); nh = newH;
        }
        onChange(drag.id, { x: snapGrid(nx), y: snapGrid(ny), w: snapGrid(nw), h: snapGrid(nh) });
      }
    },
    [drag, zoom, canvasHeight, canvasWidth, onChange, blocks]
  );

  const onPointerUp = useCallback(() => {
    if (!drag) return;
    const b = getBlock(drag.id);
    if (b) {
      const patch: Partial<FreeBlock> = {};
      if (drag.kind === "move") { patch.x = b.x; patch.y = b.y; }
      else if (drag.kind === "resize") { patch.x = b.x; patch.y = b.y; patch.w = b.w; patch.h = b.h; }
      else if (drag.kind === "rotate") { patch.rotation = b.rotation; }
      onCommit(drag.id, patch);
    }
    setDrag(null);
    setGuides({ v: null, h: null });
  }, [drag, blocks, onCommit]);

  useEffect(() => {
    if (!drag) return;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [drag, onPointerMove, onPointerUp]);

  // Sair do modo de edição quando troca de seleção ou clica fora
  useEffect(() => {
    if (editingId && selectedId !== editingId) setEditingId(null);
  }, [selectedId, editingId]);

  // Keyboard: arrows, delete, ⌘D, Esc para sair de edição
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingId) { setEditingId(null); return; }
      if (editingId) return; // bloqueia atalhos enquanto edita texto
      if (!selectedId) return;
      const b = getBlock(selectedId);
      if (!b) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;

      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); onDelete(selectedId); return; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") { e.preventDefault(); onDuplicate(selectedId); return; }
      const step = e.shiftKey ? 10 : 1;
      const x = b.x ?? DEFAULTS.x, y = b.y ?? DEFAULTS.y;
      if (e.key === "ArrowLeft") { e.preventDefault(); onCommit(selectedId, { x: Math.max(0, x - step) }); }
      else if (e.key === "ArrowRight") { e.preventDefault(); onCommit(selectedId, { x: x + step }); }
      else if (e.key === "ArrowUp") { e.preventDefault(); onCommit(selectedId, { y: Math.max(0, y - step) }); }
      else if (e.key === "ArrowDown") { e.preventDefault(); onCommit(selectedId, { y: y + step }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, editingId, blocks, onCommit, onDelete, onDuplicate]);

  const sorted = useMemo(
    () => [...blocks].sort((a, b) => (a.z_index ?? 0) - (b.z_index ?? 0)),
    [blocks]
  );

  const gridStyle = {
    backgroundImage:
      "linear-gradient(to right, rgba(120,120,120,.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,120,120,.08) 1px, transparent 1px)",
    backgroundSize: `${SNAP * 4}px ${SNAP * 4}px`,
  } as React.CSSProperties;

  const commitInlineEdit = (b: FreeBlock, el: HTMLElement) => {
    const propKey = inlineProp(b.block_type);
    if (!propKey) return;
    const newValue = el.innerText;
    const currentProps = (b.props as any) || {};
    if (currentProps[propKey] === newValue) return;
    onCommit(b.id, { props: { ...currentProps, [propKey]: newValue } } as any);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={() => { onSelect(null); setEditingId(null); }}
      className="relative origin-top-left"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        transform: `scale(${zoom})`,
        transformOrigin: "top left",
        ...gridStyle,
        backgroundColor: theme.background_color,
      }}
    >
      {/* Guias de alinhamento */}
      {guides.v !== null && (
        <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: guides.v, width: 1, background: "hsl(var(--primary))", boxShadow: "0 0 0 .5px hsl(var(--primary))" }} />
      )}
      {guides.h !== null && (
        <div className="absolute left-0 right-0 pointer-events-none" style={{ top: guides.h, height: 1, background: "hsl(var(--primary))", boxShadow: "0 0 0 .5px hsl(var(--primary))" }} />
      )}

      {sorted.map((b) => {
        const x = b.x ?? DEFAULTS.x;
        const y = b.y ?? DEFAULTS.y;
        const w = b.w ?? DEFAULTS.w;
        const h = b.h ?? DEFAULTS.h;
        const isSel = selectedId === b.id;
        const isEditing = editingId === b.id;
        const propKey = inlineProp(b.block_type);
        return (
          <div
            key={b.id}
            data-block-id={b.id}
            onPointerDown={(e) => onPointerDownBlock(e, b)}
            onDoubleClick={(e) => { e.stopPropagation(); onDoubleClickBlock(b); }}
            className="absolute touch-none"
            style={{
              left: x, top: y, width: w, height: h,
              transform: b.rotation ? `rotate(${b.rotation}deg)` : undefined,
              zIndex: b.z_index ?? 0,
              outline: isSel ? "2px solid hsl(var(--primary))" : "1px dashed transparent",
              outlineOffset: 0,
              cursor: drag?.kind === "move" && drag.id === b.id ? "grabbing" : (isEditing ? "text" : "grab"),
              boxShadow: isSel ? "0 0 0 1px rgba(0,0,0,.05)" : undefined,
            }}
          >
            {isEditing && propKey ? (
              <div
                contentEditable
                suppressContentEditableWarning
                autoFocus
                onPointerDown={(e) => e.stopPropagation()}
                onBlur={(e) => { commitInlineEdit(b, e.currentTarget); setEditingId(null); }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { (e.currentTarget as HTMLElement).blur(); }
                }}
                className="w-full h-full overflow-auto outline-none p-2"
                style={{ background: "rgba(255,255,255,.05)" }}
                ref={(el) => {
                  if (el && !el.dataset.init) {
                    el.dataset.init = "1";
                    el.innerText = String(((b.props as any) || {})[propKey] || "");
                    // Foca e seleciona tudo
                    requestAnimationFrame(() => {
                      el.focus();
                      const range = document.createRange();
                      range.selectNodeContents(el);
                      const sel = window.getSelection();
                      sel?.removeAllRanges();
                      sel?.addRange(range);
                    });
                  }
                }}
              />
            ) : (
              <div className="w-full h-full overflow-hidden pointer-events-none">
                <BlockRenderer block={b} theme={theme} ownerSlug={ownerSlug} />
              </div>
            )}

            {isSel && !isEditing && (
              <>
                {/* Toolbar flutuante */}
                <div
                  data-handle="toolbar"
                  className="absolute -top-9 left-0 flex items-center gap-1 bg-background border border-border rounded-md shadow-lg px-1 py-1 z-50"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <button title="Trazer p/ frente" onClick={() => onZ(b.id, "front")} className="p-1 hover:bg-muted rounded"><ArrowUp className="h-3 w-3" /></button>
                  <button title="Enviar p/ trás" onClick={() => onZ(b.id, "back")} className="p-1 hover:bg-muted rounded"><ArrowDown className="h-3 w-3" /></button>
                  <button title="Duplicar (⌘D)" onClick={() => onDuplicate(b.id)} className="p-1 hover:bg-muted rounded"><Copy className="h-3 w-3" /></button>
                  <button title="Deletar (Del)" onClick={() => onDelete(b.id)} className="p-1 hover:bg-muted rounded text-destructive"><Trash2 className="h-3 w-3" /></button>
                  {propKey && <span className="text-[10px] text-muted-foreground px-1">2× clique p/ editar</span>}
                </div>

                {/* Handle de rotação acima do bloco */}
                <span
                  data-handle="rotate"
                  onPointerDown={(e) => onPointerDownRotate(e, b)}
                  title="Arraste para rotacionar (Shift = 15°)"
                  className="absolute flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow"
                  style={{
                    left: "50%", top: -28, width: 18, height: 18,
                    transform: "translateX(-50%)", cursor: "grab", zIndex: 51,
                  }}
                >
                  <RotateCw className="h-3 w-3" />
                </span>

                {/* Handles de resize */}
                {HANDLES.map((dir) => (
                  <span
                    key={dir}
                    data-handle={dir}
                    onPointerDown={(e) => onPointerDownHandle(e, b, dir)}
                    className="absolute bg-primary border border-background rounded-sm"
                    style={{
                      width: 10, height: 10,
                      ...handlePos(dir),
                      cursor: handleCursor(dir),
                      zIndex: 51,
                    }}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}

      {blocks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm pointer-events-none">
          Adicione blocos pela barra lateral. Arraste, redimensione, rotacione e dê 2× clique para editar texto.
        </div>
      )}
    </div>
  );
}

function handlePos(dir: HandleDir): React.CSSProperties {
  const e = -5;
  switch (dir) {
    case "nw": return { left: e, top: e };
    case "n":  return { left: "50%", top: e, transform: "translateX(-50%)" };
    case "ne": return { right: e, top: e };
    case "e":  return { right: e, top: "50%", transform: "translateY(-50%)" };
    case "se": return { right: e, bottom: e };
    case "s":  return { left: "50%", bottom: e, transform: "translateX(-50%)" };
    case "sw": return { left: e, bottom: e };
    case "w":  return { left: e, top: "50%", transform: "translateY(-50%)" };
  }
}
function handleCursor(dir: HandleDir) {
  return ({
    n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
    nw: "nwse-resize", se: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize",
  } as Record<HandleDir, string>)[dir];
}
