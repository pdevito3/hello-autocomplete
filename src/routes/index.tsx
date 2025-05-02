import { BasicExample } from "@/examples/basic";
import { ControlledCustomEntryExample } from "@/examples/controlled-custom-entry";
import { CustomEntryExample } from "@/examples/custom-entry";
import { CustomRenderingExample } from "@/examples/custom-options";
import { DisclosureExample } from "@/examples/disclosure";
import { GroupedFruitExample } from "@/examples/grouping";
import { InfiniteAutocompleteExample } from "@/examples/infinite";
import { MultiGroupedFruitExample } from "@/examples/multi-grouping";
import MultiFruitExample from "@/examples/multiselect";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: HomePage });

const queryClient = new QueryClient();

// Main page component wrapping all examples
export default function HomePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8 grid gap-6 grid-cols-2">
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
            <DisclosureExample />
          </Example>
          {/* <Example title="Controlled on form">
            <FruitForm />
          </Example> */}
          <Example title="Grouping">
            <GroupedFruitExample />
          </Example>
          <Example title="Multi Grouping">
            <MultiGroupedFruitExample />
          </Example>
          <Example title="Multi Select">
            <MultiFruitExample />
          </Example>
          <Example title="Animation">
            <p>TODO</p>
          </Example>
          <Example title="Custom Value">
            <CustomEntryExample />
          </Example>
          <Example title="Controlled Custom Value">
            <ControlledCustomEntryExample />
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
