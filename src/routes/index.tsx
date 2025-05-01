import { BasicExample } from "@/examples/basic";
import { CustomRenderingExample } from "@/examples/custom-options";
import { InfiniteAutocompleteExample } from "@/examples/infinite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: HomePage });

const queryClient = new QueryClient();

// Main page component wrapping all examples
export default function HomePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Example title="Basic Autocomplete with debounce and clear button">
            <BasicExample />
          </Example>
          <Example title="Custom Rendering">
            <CustomRenderingExample />
          </Example>
          <Example title="Infinite Autocomplete">
            <InfiniteAutocompleteExample />
          </Example>
          <Example title="Disclosure Button">
            <p>TODO</p>
          </Example>
          <Example title="Controlled on form">
            <p>TODO</p>
          </Example>
          <Example title="Grouping">
            <p>TODO</p>
          </Example>
          <Example title="Animation">
            <p>TODO</p>
          </Example>
          <Example title="Create New Internal">
            <p>TODO</p>
          </Example>
          <Example title="Create New External Action">
            <p>TODO</p>
          </Example>
          <Example title="Placement">
            <p>TODO</p>
          </Example>
          <Example title="Radix/Shadcn popover">
            <p>TODO</p>
          </Example>
          <Example title="Select Tab Organization">
            <a
              href="https://ariakit.org/examples/combobox-tabs"
              className="text-blue-500 hover:underline"
            >
              TODO
            </a>
          </Example>
          <Example title="Rows">
            <p>TODO</p>
          </Example>
        </div>
      </div>
    </QueryClientProvider>
  );
}

function Example({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}
