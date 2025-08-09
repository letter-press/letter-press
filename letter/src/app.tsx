import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import "./styles/theme.css";
import "./lib/theme-registry"; // Register additional themes
import { ThemeProvider } from "~/lib/theme-manager";

export default function App() {
  return (
    <ThemeProvider>
      <Router
        root={(props) => (
          <>
            <Suspense>{props.children}</Suspense>
          </>
        )}
      >
        <FileRoutes />
      </Router>
    </ThemeProvider>
  );
}
