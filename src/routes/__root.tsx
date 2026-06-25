import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="max-w-md text-center text-snow">
        <h1 className="text-7xl font-bold text-gold">404</h1>
        <p className="mt-4 label-caps text-muted-dark">Rota não encontrada</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-gold px-6 py-3 label-caps text-obsidian">
          Voltar
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-snow">
      <div className="max-w-md text-center">
        <h1 className="label-caps-lg text-gold">Algo falhou</h1>
        <p className="mt-2 text-sm text-muted-dark">Tente novamente.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-full bg-gold px-6 py-3 label-caps text-obsidian"
        >
          Tentar de novo
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Olympus Protocol — Disciplina · Evolução · Excelência" },
      { name: "description", content: "Aplicativo de treino premium para atletas disciplinados. Acompanhe carga, volume e evolução com o rigor de um protocolo olímpico." },
      { name: "theme-color", content: "#0A0A0A" },
      { property: "og:title", content: "Olympus Protocol" },
      { property: "og:description", content: "Disciplina. Evolução. Excelência." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-[100dvh] w-full bg-obsidian">
        <div className="mx-auto w-full sm:max-w-[420px] min-h-[100dvh] relative overflow-hidden sm:my-0">
          <Outlet />
        </div>
      </div>
    </QueryClientProvider>
  );
}
