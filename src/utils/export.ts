import { useGridStore } from "../stores/gridStore";

export type MapExport = {
  gridSize: number;
  borders: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>;
  blockedCells: Array<{
    x: number;
    y: number;
  }>;
  startCell: { x: number; y: number } | null;
  endCell: { x: number; y: number } | null;
};

export function exportMap(): MapExport {
  const state = useGridStore.getState();

  // Transformer les cellules bloquées en tableau
  const blockedCells = Object.values(state.cells)
    .filter((cell) => cell.isBlocked)
    .map(({ x, y }) => ({ x, y }));

  return {
    gridSize: state.gridSize,
    borders: state.borders,
    blockedCells,
    startCell: state.startCell,
    endCell: state.endCell,
  };
}

export function importMap(data: MapExport): void {
  const {
    setGridSize,
    addBorder,
    toggleCellBlocked,
    setStartCell,
    setEndCell,
    resetPath,
  } = useGridStore.getState();

  // Réinitialiser le chemin
  resetPath();

  // Définir la taille de la grille
  setGridSize(data.gridSize);

  // Ajouter les bordures
  data.borders.forEach((border) => {
    addBorder(border);
  });

  // Marquer les cellules bloquées
  data.blockedCells.forEach(({ x, y }) => {
    // Basculer deux fois si la cellule est déjà bloquée
    const cellKey = `${x},${y}`;
    const cells = useGridStore.getState().cells;
    if (!cells[cellKey] || !cells[cellKey].isBlocked) {
      toggleCellBlocked(x, y);
    }
  });

  // Définir les points de départ et d'arrivée
  if (data.startCell) {
    setStartCell(data.startCell.x, data.startCell.y);
  }

  if (data.endCell) {
    setEndCell(data.endCell.x, data.endCell.y);
  }
}

export function exportMapAsJson(): string {
  return JSON.stringify(exportMap(), null, 2);
}

export function importMapFromJson(json: string): void {
  try {
    const data = JSON.parse(json) as MapExport;
    importMap(data);
    return;
  } catch (error) {
    console.error("Erreur lors de l'import de la carte :", error);
    throw new Error("Le format du fichier JSON est invalide.");
  }
}
