import { ThemeProvider } from "./components/theme-provider";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { ModeToggle } from "./components/mode-toggle";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Mon Application</h1>
            <ModeToggle />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bienvenue</CardTitle>
              <CardDescription>
                Une démonstration de shadcn/ui avec thème sombre/clair
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Cette page utilise les composants de shadcn/ui et le
                ThemeProvider pour gérer le thème.
              </p>
            </CardContent>
            <CardFooter>
              <Button>Commencer</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
