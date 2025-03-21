"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { PeopleManager } from "@/components/people-manager";
import { DebtManager } from "@/components/debt-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Download,
  Plus,
  Settings,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import type { Person, Debt } from "@/lib/types";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
export function DebtTracker() {
  const [people, setPeople] = useState<Person[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [activeTab, setActiveTab] = useState("debts");
  const [addDebtPersonId, setAddDebtPersonId] = useState<string | null>(null);
  const [addDebtIsBorrowed, setAddDebtIsBorrowed] = useState(false);

  // Reference to the DebtManager component
  const debtManagerRef = useRef<{
    initFormForPerson: (personId: string, isBorrowed: boolean) => void;
  } | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedPeople = localStorage.getItem("people");
    const savedDebts = localStorage.getItem("debts");

    if (savedPeople) {
      setPeople(JSON.parse(savedPeople));
    }

    if (savedDebts) {
      setDebts(JSON.parse(savedDebts));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("people", JSON.stringify(people));
    localStorage.setItem("debts", JSON.stringify(debts));
  }, [people, debts]);

  const exportData = (format: "json" | "csv") => {
    const data = {
      people,
      debts,
    };

    if (format === "json") {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "debt-tracker-data.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === "csv") {
      // Create CSV for debts
      const headers = [
        "ID",
        "Person",
        "Amount",
        "Description",
        "Date",
        "Status",
      ];
      const debtRows = debts.map((debt) => {
        const person = people.find((p) => p.id === debt.personId);
        return [
          debt.id,
          person?.name || "Unknown",
          debt.amount,
          debt.description,
          debt.date,
          debt.status,
        ];
      });

      const csvContent = [
        headers.join(","),
        ...debtRows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "debt-tracker-data.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const data = JSON.parse(result);

        if (data.people && Array.isArray(data.people)) {
          setPeople(data.people);
        }

        if (data.debts && Array.isArray(data.debts)) {
          setDebts(data.debts);
        }

        toast("Data imported successfully!");
      } catch (error) {
        toast.error("Failed to import data!", {
          description: "Please make sure the file is valid JSON.",
        });
      }
    };
    reader.readAsText(file);

    // Reset the input
    event.target.value = "";
  };

  // Function to handle adding a debt from the People tab
  const handleAddDebtToPerson = (personId: string, isBorrowed: boolean) => {
    setActiveTab("debts");

    // Use setTimeout to ensure the tab change happens first
    setTimeout(() => {
      if (debtManagerRef.current) {
        debtManagerRef.current.initFormForPerson(personId, isBorrowed);
      }
    }, 0);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col gap-8">
        {/* Enhanced Header Section */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-800 to-zinc-600 dark:from-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
              Debtly
            </h1>
            <p className="text-muted-foreground text-sm">
              Keep track of money you owe and money owed to you
            </p>
          </div>

          {/* Actions Menu - Dropdown for Mobile, Expanded for Desktop */}
          <div className="hidden md:flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => exportData("json")}
              className="flex items-center gap-2 bg-white dark:bg-zinc-900 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => exportData("csv")}
              className="flex items-center gap-2 bg-white dark:bg-zinc-900 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-white dark:bg-zinc-900 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <input
                  type="file"
                  accept=".json"
                  id="import-json"
                  className="absolute inset-0 opacity-0 w-full cursor-pointer"
                  onChange={importData}
                />
                <Upload className="h-4 w-4" />
                Import JSON
              </Button>
            </div>
          </div>

          {/* Mobile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-zinc-900"
              >
                <Settings className="h-4 w-4 mr-2" />
                Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => exportData("json")}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportData("csv")}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem>
                <label
                  htmlFor="mobile-import-json"
                  className="flex items-center cursor-pointer w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import JSON
                </label>
                <input
                  type="file"
                  accept=".json"
                  id="mobile-import-json"
                  className="hidden"
                  onChange={importData}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Enhanced Tabs */}
        <div className="rounded-xl">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <TabsList className="grid w-52 grid-cols-2 rounded-lg bg-zinc-100 dark:bg-zinc-900">
                <TabsTrigger value="debts" className="rounded-md font-medium">
                  <CreditCard className="h-4 w-4" />
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="people" className="rounded-md font-medium">
                  <Users className="h-4 w-4 mr-2" />
                  People
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="debts"
              className="mt-2 focus-visible:outline-none focus-visible:ring-0"
            >
              <DebtManager
                ref={debtManagerRef}
                people={people}
                debts={debts}
                setDebts={setDebts}
              />
            </TabsContent>
            <TabsContent
              value="people"
              className="mt-2 focus-visible:outline-none focus-visible:ring-0"
            >
              <PeopleManager
                people={people}
                setPeople={setPeople}
                debts={debts}
                onAddDebt={handleAddDebtToPerson}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
