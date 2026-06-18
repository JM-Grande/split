"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { exportDataAction, importDataAction } from "@/lib/actions/data-management";
import { Download, Upload, Database, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DataManagementForm({ availableYears = [] }: { availableYears?: number[] }) {
  const defaultYear = availableYears.length > 0 ? availableYears[0] : new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear.toString());
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [clearExisting, setClearExisting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await exportDataAction(parseInt(selectedYear));
      if (response.success && response.data) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        const currentDateStr = new Date().toISOString().split("T")[0];
        downloadAnchor.setAttribute("download", `split_public_${selectedYear}_${currentDateStr}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success(`Backup for ${selectedYear} downloaded successfully!`);
      } else {
        toast.error(response.error || "Failed to export data.");
      }
    } catch {
      toast.error("An error occurred during export.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        toast.error("Please select a valid JSON backup file.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to import.");
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const rawData = JSON.parse(e.target?.result as string);
        const response = await importDataAction(rawData, clearExisting);

        if (response.success) {
          toast.success(response.message || `Successfully imported ${response.count} records!`);
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
          const errorMessage = response.error || "Failed to import data.";
          const detailsMessage = response.details && response.details.length > 0
            ? `\nDetails:\n${response.details.join("\n")}`
            : "";
          toast.error(`${errorMessage}${detailsMessage}`, {
            duration: 8000
          });
        }
      } catch {
        toast.error("Failed to parse JSON file. Ensure it is a valid Split backup.");
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read file.");
      setIsImporting(false);
    };

    reader.readAsText(selectedFile);
  };

  const selectYearsList = availableYears.length > 0 ? availableYears : [new Date().getFullYear()];

  return (
    <div className="grid gap-6 md:grid-cols-2 w-full max-w-4xl mx-auto col-span-2">
      {/* Export Card */}
      <Card className="flex flex-col justify-between">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" /> Export Backup
          </CardTitle>
          <CardDescription>
            Download your financial ledger history for a specific year. Keep this file safe as a local backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="export-year" className="text-xs font-semibold text-foreground">
              Select Year
            </label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="export-year" className="w-full h-9">
                <SelectValue placeholder="Select a year" />
              </SelectTrigger>
              <SelectContent position="popper">
                {selectYearsList.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/20 text-xs text-muted-foreground flex gap-2.5">
            <Database className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              Exports logged weeks, operational notes, share breakdowns, and your user preferences for the selected year into a standard JSON file format.
            </span>
          </div>
        </CardContent>
        <CardFooter className="border-t border-border pt-4">
          <Button 
            onClick={handleExport} 
            disabled={isExporting} 
            className="w-full flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Download Backup
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Import Card */}
      <Card className="flex flex-col justify-between">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" /> Import Backup
          </CardTitle>
          <CardDescription>
            Restore sales entries and splits from a previously saved JSON backup file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Picker */}
          <div className="space-y-2">
            <input 
              type="file" 
              accept=".json"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
              id="backup-upload-input"
            />
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-start text-muted-foreground font-normal border-dashed"
              >
                <Upload className="h-4 w-4 mr-2" />
                {selectedFile ? selectedFile.name : "Choose JSON backup file..."}
              </Button>
            </div>
          </div>

          {/* Merge Option Checkbox */}
          <div className="flex items-start space-x-3 p-3 rounded-lg border border-border bg-muted/10">
            <input 
              type="checkbox" 
              id="clearExisting"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <div className="grid gap-1.5 leading-none">
              <label 
                htmlFor="clearExisting"
                className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5"
              >
                Smart Clearing
              </label>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Only deletes sales for the imported year. Your other years are protected.
              </p>
            </div>
          </div>

          {/* Alert removed as per request to keep cards aligned */}
        </CardContent>
        <CardFooter className="border-t border-border pt-4">
          <Button 
            onClick={handleImport} 
            disabled={isImporting || !selectedFile} 
            className="w-full flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white"
          >
            {isImporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Restore Backup
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
