import { createAsync } from "@solidjs/router";
import { Show } from "solid-js";
import { getSessionOptional } from "~/lib/auth-utils";
import { ThemeSettings } from "~/components/admin/theme-settings";
import AdminLayout from "./layout";

async function getThemeUser() {
  "use server";
  const session = await getSessionOptional();
  return session?.user;
}

export default function AdminThemes() {
  const user = createAsync(() => getThemeUser());

  return (
    <Show when={user()}>
      <AdminLayout user={user()!}>
        <ThemeSettings />
      </AdminLayout>
    </Show>
  );
}