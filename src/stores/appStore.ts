import { create } from "zustand";

export type InteractionMode =
  | "pan" // Déplacer l'image
  | "border" // Ajouter/Supprimer des bordures
  | "cell" // Bloquer/Débloquer des cellules
  | "start" // Définir le point de départ
  | "end" // Définir le point d'arrivée
  | "findPath"; // Calculer le chemin

type AppState = {
  interactionMode: InteractionMode;
  showGrid: boolean;
  isEditing: boolean;

  // Actions
  setInteractionMode: (mode: InteractionMode) => void;
  toggleGrid: () => void;
  toggleEditMode: () => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  interactionMode: "pan",
  showGrid: true,
  isEditing: true,

  setInteractionMode: (mode) => set({ interactionMode: mode }),

  toggleGrid: () => set({ showGrid: !get().showGrid }),

  toggleEditMode: () => set({ isEditing: !get().isEditing }),
}));
