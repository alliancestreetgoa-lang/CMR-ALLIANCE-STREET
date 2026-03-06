// Helper to get client name
export const getClientName = (id: string) => clients.find(c => c.id === id)?.companyName || "Unknown Client";
export const getUserName = (id: string) => users.find(u => u.id === id)?.name || "Unknown User";

// Function to generate quarterly VAT records for a client if they don't exist
export const getVatRecord = (clientId: string, quarter: VatQuarter): VatRecord | undefined => {
  return vatRecords.find(r => r.clientId === clientId && r.vatQuarter === quarter);
};

// Named exports for individual data arrays
export { users, clients, vatRecords, tasks, auditLogs };

export const mockData = {
  users,
  clients,
  vatRecords,
  tasks,
  auditLogs
};