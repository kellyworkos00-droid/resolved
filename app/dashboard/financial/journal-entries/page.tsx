'use client';

import { useEffect, useState } from 'react';

type JournalEntry = {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  status: string;
  totalDebit: number;
  totalCredit: number;
};

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/financial/journal-entries');
        const payload = res.ok ? await res.json() : null;
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        setEntries(rows);
      } catch (error) {
        console.error('Failed to load journal entries:', error);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Journal Entries</h1>
      {loading ? (
        <p className="text-gray-600">Loading journal entries...</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-600">No journal entries found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Entry #</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Debit</th>
                <th className="px-4 py-2 text-left">Credit</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t">
                  <td className="px-4 py-2">{entry.entryNumber}</td>
                  <td className="px-4 py-2">{new Date(entry.entryDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{entry.description}</td>
                  <td className="px-4 py-2">{entry.totalDebit}</td>
                  <td className="px-4 py-2">{entry.totalCredit}</td>
                  <td className="px-4 py-2">{entry.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
