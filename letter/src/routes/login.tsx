import { type RouteSectionProps } from "@solidjs/router";
import { signIn } from "@auth/solid-start/client";
import { Show, createSignal } from "solid-js";

export default function Login(props: RouteSectionProps) {
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [isRegistering, setIsRegistering] = createSignal(false);
  const [name, setName] = createSignal("");

  const handleSignIn = async (provider: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const redirectTo = Array.isArray(props.location.query.redirectTo)
        ? props.location.query.redirectTo[0]
        : props.location.query.redirectTo || "/";

      await signIn(provider, {
        redirectTo: redirectTo,
      });
    } catch {
      setError("Failed to sign in. Please try again.");
      setIsLoading(false);
    }
  };

  const handleCredentialsSignIn = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const redirectTo = Array.isArray(props.location.query.redirectTo)
        ? props.location.query.redirectTo[0]
        : props.location.query.redirectTo || "/";

      const result = await signIn("credentials", {
        email: email(),
        password: password(),
        redirectTo: redirectTo,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      }
    } catch {
      setError("Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email(),
          password: password(),
          name: name(),
        }),
      });

      const data = await response.json() as { error?: string; user?: any };

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Auto sign in after successful registration
      const redirectTo = Array.isArray(props.location.query.redirectTo)
        ? props.location.query.redirectTo[0]
        : props.location.query.redirectTo || "/";

      await signIn("credentials", {
        email: email(),
        password: password(),
        redirectTo: redirectTo,
      });
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegistering() ? "Create your account" : "Sign in to Letter-Press"}
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Welcome to your WordPress-like CMS
          </p>
        </div>

        <div class="mt-8 space-y-6">
          <Show when={error()}>
            <div
              class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <span class="block sm:inline">{error()}</span>
            </div>
          </Show>

          <form
            class="space-y-4"
            onSubmit={isRegistering() ? handleRegister : handleCredentialsSignIn}
          >
            <Show when={isRegistering()}>
              <div>
                <label for="name" class="sr-only">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  class="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Full name (optional)"
                />
              </div>
            </Show>

            <div>
              <label for="email" class="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                class="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>

            <div>
              <label for="password" class="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autocomplete={isRegistering() ? "new-password" : "current-password"}
                required
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                class="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading()}
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Show
                  when={isLoading()}
                  fallback={isRegistering() ? "Create Account" : "Sign In"}
                >
                  <div class="flex items-center">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isRegistering() ? "Creating account..." : "Signing in..."}
                  </div>
                </Show>
              </button>
            </div>
          </form>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            onClick={() => handleSignIn("google")}
            disabled={isLoading()}
            class="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Show
              when={isLoading()}
              fallback={
                <span class="flex items-center">
                  <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </span>
              }
            >
              <div class="flex items-center">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500 mr-2"></div>
                Signing in...
              </div>
            </Show>
          </button>

          <div class="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering());
                setError(null);
              }}
              class="text-indigo-600 hover:text-indigo-500"
            >
              {isRegistering()
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <div class="text-center">
          <p class="text-sm text-gray-600">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </main>
  );
}
