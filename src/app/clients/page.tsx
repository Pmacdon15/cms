import { Users } from "lucide-react";
import { ClientList } from "../../components/ClientList";
import { Navbar } from "../../components/Navbar";
import { dalGetClients } from "../../dal/clients";

export const revalidate = 0; // Force dynamic server rendering

export default async function ClientsPage() {
  // Fetch initial clients server-side from DAL
  const response = await dalGetClients();
  const clients = response.isOk() ? response.value : [];
  const dbError = response.isErr() ? response.error.message : null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6">
        {/* Title Heading */}
        <div className="flex flex-col gap-2 border-b border-zinc-100 pb-5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-605" />
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
              Clients Directory
            </h1>
          </div>
          <p className="text-sm text-zinc-500">
            View customer details, opt-in/opt-out status for each communication
            channel, and register new contacts.
          </p>
        </div>

        {/* DB Connection Alert Fallback */}
        {dbError && (
          <div className="p-4 rounded-xl border border-yellow-250 bg-yellow-50/70 text-yellow-900 text-xs">
            <span className="font-bold block mb-1">
              ⚠️ Local Fallback Active
            </span>
            Failed to connect to Neon DB: {dbError}. Using simulated contact
            lists. Run the DDL script in{" "}
            <code className="text-yellow-850 bg-yellow-100/55 px-1 py-0.5 rounded">
              schema.sql
            </code>{" "}
            inside your Neon database to fix.
          </div>
        )}

        {/* Dynamic client manager list */}
        <ClientList initialClients={clients} />
      </main>
    </div>
  );
}
