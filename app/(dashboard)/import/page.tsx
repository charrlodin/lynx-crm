"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

interface ParsedRow {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  value?: number;
  tags?: string[];
}

type Step = "upload" | "mapping" | "preview" | "complete";

export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState<{ imported: number } | null>(
    null
  );

  const workspace = useQuery(api.workspaces.getCurrentWorkspace);
  const pipelineData = useQuery(
    api.pipelines.getPipelineWithStages,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const usage = useQuery(
    api.workspaces.getUsage,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  const importLeads = useMutation(api.leads.importLeads);

  const fieldOptions = [
    { value: "", label: "Skip" },
    { value: "name", label: "Name (required)" },
    { value: "company", label: "Company" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "value", label: "Value" },
    { value: "tags", label: "Tags" },
  ];

  const downloadTemplate = () => {
    const headers = ["Name", "Company", "Email", "Phone", "Value", "Tags"];
    const exampleRows = [
      ["John Smith", "Acme Corp", "john@acme.com", "+1 555 123 4567", "25000", "enterprise, inbound"],
      ["Sarah Johnson", "TechStart Inc", "sarah@techstart.io", "+1 555 987 6543", "15000", "startup, referral"],
      ["Mike Chen", "GlobalTech", "m.chen@globaltech.com", "+1 555 456 7890", "50000", "enterprise"],
    ];
    
    const csvContent = [
      headers.join(","),
      ...exampleRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lynx-crm-import-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      setError("");
      setFile(selectedFile);

      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          setError("CSV must have a header row and at least one data row");
          return;
        }

        const parseCSVLine = (line: string) => {
          const result: string[] = [];
          let current = "";
          let inQuotes = false;

          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headerRow = parseCSVLine(lines[0]);
        const dataRows = lines.slice(1).map(parseCSVLine);

        if (dataRows.length > (usage?.limits.MAX_ROWS_PER_IMPORT ?? 500)) {
          setError(`Maximum ${usage?.limits.MAX_ROWS_PER_IMPORT ?? 500} rows per import`);
          return;
        }

        setHeaders(headerRow);
        setRows(dataRows);

        // Auto-map common column names
        const autoMapping: Record<string, string> = {};
        headerRow.forEach((header) => {
          const h = header.toLowerCase();
          if (h.includes("name") && !h.includes("company")) autoMapping[header] = "name";
          else if (h.includes("company") || h.includes("organization")) autoMapping[header] = "company";
          else if (h.includes("email")) autoMapping[header] = "email";
          else if (h.includes("phone") || h.includes("tel")) autoMapping[header] = "phone";
          else if (h.includes("value") || h.includes("amount") || h.includes("deal")) autoMapping[header] = "value";
          else if (h.includes("tag")) autoMapping[header] = "tags";
        });
        setMapping(autoMapping);
        setStep("mapping");
      };

      reader.readAsText(selectedFile);
    },
    [usage?.limits.MAX_ROWS_PER_IMPORT]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile?.type === "text/csv" || droppedFile?.name.endsWith(".csv")) {
        handleFileSelect(droppedFile);
      } else {
        setError("Please upload a CSV file");
      }
    },
    [handleFileSelect]
  );

  const handleMappingComplete = () => {
    const hasName = Object.values(mapping).includes("name");
    if (!hasName) {
      setError("Name field is required");
      return;
    }

    const parsed: ParsedRow[] = [];

    for (const row of rows) {
      const lead: ParsedRow = { name: "" };

      headers.forEach((header, idx) => {
        const field = mapping[header];
        const value = row[idx]?.trim();

        if (!field || !value) return;

        switch (field) {
          case "name": lead.name = value; break;
          case "company": lead.company = value; break;
          case "email": lead.email = value; break;
          case "phone": lead.phone = value; break;
          case "value":
            const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
            if (!isNaN(num)) lead.value = num;
            break;
          case "tags": lead.tags = value.split(",").map((t) => t.trim()); break;
        }
      });

      if (lead.name) parsed.push(lead);
    }

    setParsedRows(parsed);
    setStep("preview");
  };

  const handleImport = async () => {
    if (!workspace || !pipelineData) return;

    const firstStage = pipelineData.stages[0];
    if (!firstStage) {
      setError("No stages found");
      return;
    }

    setImporting(true);
    setError("");

    try {
      const result = await importLeads({
        workspaceId: workspace._id,
        pipelineId: pipelineData._id,
        stageId: firstStage._id,
        leads: parsedRows,
      });

      setImportResult(result);
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setStep("upload");
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setParsedRows([]);
    setError("");
    setImportResult(null);
  };

  if (!workspace || !pipelineData) {
    return (
      <div className="p-12 flex items-center justify-center min-h-screen">
        <div className="text-stone-400 text-sm">Loading...</div>
      </div>
    );
  }

  const currency = workspace.settings?.currency || "$";

  return (
    <div className="min-h-screen">
      <header className="px-12 pt-12 pb-8 border-b border-stone-200 dark:border-stone-800">
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">
          Import
        </p>
        <h1 className="font-serif text-3xl tracking-tight">
          {step === "upload" && "Upload CSV"}
          {step === "mapping" && "Map columns"}
          {step === "preview" && "Review import"}
          {step === "complete" && "Import complete"}
        </h1>
      </header>

      <div className="px-12 py-10 max-w-2xl">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 text-xs">
          {["Upload", "Map", "Review", "Done"].map((label, idx) => {
            const stepNames: Step[] = ["upload", "mapping", "preview", "complete"];
            const isActive = stepNames.indexOf(step) >= idx;
            return (
              <div key={label} className="flex items-center gap-2">
                <span className={isActive ? "text-stone-900 dark:text-white" : "text-stone-400"}>
                  {idx + 1}. {label}
                </span>
                {idx < 3 && <span className="text-stone-300">→</span>}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
            {error}
          </div>
        )}

        {/* Upload */}
        {step === "upload" && (
          <div>
            {/* Template Download */}
            <div className="mb-8 p-6 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium mb-1">Start with our template</h3>
                  <p className="text-sm text-stone-500">
                    Download our CSV template with pre-mapped headers. Fill it in, 
                    then upload — no column mapping needed.
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex-shrink-0 px-4 py-2 border border-stone-300 dark:border-stone-700 rounded-lg text-sm hover:bg-white dark:hover:bg-stone-800 transition-colors"
                >
                  Download template
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-800">
                <p className="text-xs text-stone-400 mb-2">Template includes these columns:</p>
                <div className="flex flex-wrap gap-2">
                  {["Name", "Company", "Email", "Phone", "Value", "Tags"].map((col) => (
                    <span 
                      key={col} 
                      className={`px-2 py-1 text-xs rounded ${
                        col === "Name" 
                          ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900" 
                          : "bg-stone-200 dark:bg-stone-800"
                      }`}
                    >
                      {col}{col === "Name" && " *"}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border border-dashed border-stone-300 dark:border-stone-700 rounded-lg p-12 text-center hover:border-stone-400 dark:hover:border-stone-600 transition-colors"
            >
              <p className="text-lg mb-2">Drop your CSV here</p>
              <p className="text-sm text-stone-500 mb-6">
                or click to browse · Max {usage?.limits.MAX_ROWS_PER_IMPORT ?? 500} rows
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="inline-block px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded text-sm cursor-pointer hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors"
              >
                Select file
              </label>
            </div>
          </div>
        )}

        {/* Mapping */}
        {step === "mapping" && (
          <div>
            <p className="text-sm text-stone-500 mb-6">
              {file?.name} · {rows.length} rows
            </p>

            <div className="space-y-3 mb-6">
              {headers.map((header) => (
                <div key={header} className="flex items-center gap-4">
                  <span className="w-32 text-sm truncate">{header}</span>
                  <span className="text-stone-400">→</span>
                  <select
                    value={mapping[header] ?? ""}
                    onChange={(e) => setMapping({ ...mapping, [header]: e.target.value })}
                    className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-sm focus:outline-none"
                  >
                    {fieldOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={resetImport} className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleMappingComplete}
                className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded text-sm"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        {step === "preview" && (
          <div>
            <p className="text-sm text-stone-500 mb-6">
              {parsedRows.length} leads ready to import
            </p>

            <div className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 dark:bg-stone-900">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-stone-400">Name</th>
                    <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-stone-400">Company</th>
                    <th className="text-right px-4 py-2 text-xs uppercase tracking-widest text-stone-400">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-t border-stone-100 dark:border-stone-800">
                      <td className="px-4 py-2">{row.name}</td>
                      <td className="px-4 py-2 text-stone-500">{row.company ?? "—"}</td>
                      <td className="px-4 py-2 text-right">{row.value ? `${currency}${row.value.toLocaleString()}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedRows.length > 5 && (
                <div className="px-4 py-2 text-xs text-stone-400 bg-stone-50 dark:bg-stone-900">
                  + {parsedRows.length - 5} more
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("mapping")} className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded text-sm disabled:opacity-50"
              >
                {importing ? "Importing..." : `Import ${parsedRows.length} leads`}
              </button>
            </div>
          </div>
        )}

        {/* Complete */}
        {step === "complete" && importResult && (
          <div className="text-center py-8">
            <p className="font-serif text-4xl mb-4">{importResult.imported}</p>
            <p className="text-stone-500 mb-8">leads imported successfully</p>
            <div className="flex justify-center gap-4">
              <button onClick={resetImport} className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
                Import more
              </button>
              <Link
                href="/pipeline"
                className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded text-sm"
              >
                View pipeline
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
