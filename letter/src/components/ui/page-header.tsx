import { A } from "@solidjs/router";

interface PageHeaderProps {
  title: string;
  backLink?: {
    href: string;
    label: string;
  };
  actions?: () => any;
}

export function PageHeader(props: PageHeaderProps) {
  return (
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-gray-900">{props.title}</h1>
        <div class="flex items-center space-x-4">
          {props.actions?.()}
          {props.backLink && (
            <A
              href={props.backLink.href}
              class="text-gray-600 hover:text-gray-900"
            >
              ← {props.backLink.label}
            </A>
          )}
        </div>
      </div>
    </div>
  );
}
