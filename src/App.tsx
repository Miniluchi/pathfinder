import { ThemeProvider } from "./components/theme-provider";
import { MapEditor } from "./components/map-editor";
import { ImageUploader } from "./components/image-uploader";
import { Toolbar } from "./components/toolbar";
import { useImageStore } from "./stores/imageStore";

function App() {
  const { image } = useImageStore();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="pathfinder-theme">
      <div className="min-h-screen bg-background text-foreground">
        {image ? (
          <>
            <Toolbar />
            <MapEditor />
          </>
        ) : (
          <div className="container mx-auto flex min-h-screen items-center justify-center py-10">
            <ImageUploader />
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
