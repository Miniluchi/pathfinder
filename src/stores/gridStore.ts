import { create } from "zustand";

type Cell = {
  x: number;
  y: number;
  isBlocked: boolean;
};

type Border = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type GridState = {
  gridSize: number;
  borders: Border[];
  cells: Record<string, Cell>;
  startCell: { x: number; y: number } | null;
  endCell: { x: number; y: number } | null;
  path: { x: number; y: number }[];

  // Actions
  setGridSize: (size: number) => void;
  addBorder: (border: Border) => void;
  removeBorder: (border: Border) => void;
  toggleCellBlocked: (x: number, y: number) => void;
  setStartCell: (x: number, y: number) => void;
  setEndCell: (x: number, y: number) => void;
  setPath: (path: { x: number; y: number }[]) => void;
  resetPath: () => void;
  isBorderAt: (x1: number, y1: number, x2: number, y2: number) => boolean;
};

// Fonction utilitaire pour créer une clé unique pour chaque cellule
const cellKey = (x: number, y: number) => `${x},${y}`;

// Fonction utilitaire pour créer une clé unique pour chaque bordure
const borderKey = (x1: number, y1: number, x2: number, y2: number) => {
  // Normaliser la bordure pour assurer une clé cohérente
  if (x1 > x2 || (x1 === x2 && y1 > y2)) {
    return `${x2},${y2}-${x1},${y1}`;
  }
  return `${x1},${y1}-${x2},${y2}`;
};

export const useGridStore = create<GridState>((set, get) => ({
  gridSize: 32, // Taille par défaut des cellules en pixels
  borders: [],
  cells: {},
  startCell: null,
  endCell: null,
  path: [],

  setGridSize: (size) => set({ gridSize: size }),

  addBorder: (border) => {
    const currentBorders = get().borders;
    const borderExists = get().isBorderAt(
      border.x1,
      border.y1,
      border.x2,
      border.y2
    );

    if (!borderExists) {
      set({ borders: [...currentBorders, border] });
    }
  },

  removeBorder: (border) => {
    const currentBorders = get().borders;
    // Normaliser les coordonnées pour la comparaison
    const key = borderKey(border.x1, border.y1, border.x2, border.y2);

    set({
      borders: currentBorders.filter((b) => {
        const bKey = borderKey(b.x1, b.y1, b.x2, b.y2);
        return bKey !== key;
      }),
    });
  },

  toggleCellBlocked: (x, y) => {
    const key = cellKey(x, y);
    const cells = { ...get().cells };

    if (cells[key]) {
      cells[key] = {
        ...cells[key],
        isBlocked: !cells[key].isBlocked,
      };
    } else {
      cells[key] = {
        x,
        y,
        isBlocked: true,
      };
    }

    set({ cells });
  },

  setStartCell: (x, y) => set({ startCell: { x, y } }),

  setEndCell: (x, y) => set({ endCell: { x, y } }),

  setPath: (path) => set({ path }),

  resetPath: () => set({ path: [] }),

  isBorderAt: (x1, y1, x2, y2) => {
    const key = borderKey(x1, y1, x2, y2);
    return get().borders.some((b) => {
      const bKey = borderKey(b.x1, b.y1, b.x2, b.y2);
      return bKey === key;
    });
  },
}));
