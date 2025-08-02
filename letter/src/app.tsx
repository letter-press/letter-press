import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";

// Initialize server on startup (server-side only)
if (typeof window === 'undefined') {
  import('./lib/server-init').then(({ initializeServer }) => {
    initializeServer().catch(console.error);
  });
}

export default function App() {
  return (
    <Router
      root={(props) => (
        <>
          <Suspense>{props.children}</Suspense>
        </>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
