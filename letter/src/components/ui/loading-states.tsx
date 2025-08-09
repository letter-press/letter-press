// WARNING: These components should only be used for client-side loading states
// For SSR with SolidStart, data should be fetched on the server without loading states

export function LoadingCard(props: { 
  title: string; 
  description: string; 
  icon?: string; 
}) {
  return (
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <div class="text-4xl mb-4">{props.icon || "⏳"}</div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">
        {props.title}
      </h2>
      <p class="text-gray-600">
        {props.description}
      </p>
    </div>
  );
}

export function ErrorCard(props: { 
  title: string; 
  description: string; 
  icon?: string; 
}) {
  return (
    <div class="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
      <div class="text-4xl mb-4">{props.icon || "⚠️"}</div>
      <h2 class="text-xl font-semibold text-red-900 mb-2">
        {props.title}
      </h2>
      <p class="text-red-600">
        {props.description}
      </p>
    </div>
  );
}
