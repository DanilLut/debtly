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
  LogOut,
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
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { signInWithPopup, signOut, User } from "firebase/auth";
import { auth, db, googleProvider } from "@/lib/firebase";

export function DebtTracker() {
  const [people, setPeople] = useState<Person[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [activeTab, setActiveTab] = useState("debts");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const debtManagerRef = useRef<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
          await setDoc(userDocRef, { people: [], debts: [] });
        }

        // Set up real-time listener
        const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
          const data = doc.data();
          if (data) {
            // Only update state if Firestore data is different
            setPeople((prev) =>
              JSON.stringify(prev) !== JSON.stringify(data.people)
                ? data.people
                : prev,
            );
            setDebts((prev) =>
              JSON.stringify(prev) !== JSON.stringify(data.debts)
                ? data.debts
                : prev,
            );

            // Update localStorage for exports
            localStorage.setItem("people", JSON.stringify(data.people));
            localStorage.setItem("debts", JSON.stringify(data.debts));
          }
        });

        return () => unsubscribeFirestore();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      toast.error("Login failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    if (!user) return;

    const updatePeople = async () => {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          people: people,
        });
      } catch (error) {
        toast.error("Failed to save people data");
      }
    };

    // Only update if there are actual changes
    const localStoragePeople = JSON.parse(
      localStorage.getItem("people") || "[]",
    );
    if (JSON.stringify(people) !== JSON.stringify(localStoragePeople)) {
      updatePeople();
    }
  }, [people, user]);

  useEffect(() => {
    if (!user) return;

    const updateDebts = async () => {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          debts: debts,
        });
      } catch (error) {
        toast.error("Failed to save debts data");
      }
    };

    // Only update if there are actual changes
    const localStorageDebts = JSON.parse(localStorage.getItem("debts") || "[]");
    if (JSON.stringify(debts) !== JSON.stringify(localStorageDebts)) {
      updateDebts();
    }
  }, [debts, user]);

  // Save to Firestore whenever data changes
  // useEffect(() => {
  //   if (!user) return;

  //   const saveData = async () => {
  //     try {
  //       await setDoc(doc(db, "users", user.uid), { people, debts });
  //     } catch (error) {
  //       toast.error("Failed to save data");
  //     }
  //   };

  //   saveData();
  // }, [people, debts, user]);

  // Reference to the DebtManager component
  // const debtManagerRef = useRef<{
  //   initFormForPerson: (personId: string, isBorrowed: boolean) => void;
  // } | null>(null);

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
    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const formattedTime = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS

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
      a.download = `debt-tracker-data-${formattedDate}_${formattedTime}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === "csv") {
      const headers = [
        "ID",
        "Person",
        "Amount",
        "Description",
        "Date",
        "ExpectedReturnDate",
        "Status",
      ];
      const debtRows = debts.map((debt) => {
        const person = people.find((p) => p.id === debt.personId);
        return [
          debt.id,
          `"${person?.name || "Unknown"}"`,
          debt.amount,
          `"${debt.description}"`,
          debt.date,
          debt.expectedReturnDate ?? "",
          debt.status,
        ];
      });

      const csvContent = [
        "\uFEFF" + headers.join(","),
        ...debtRows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `debt-tracker-data-${formattedDate}_${formattedTime}.csv`;
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

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Debtify</h1>
        <Button onClick={handleGoogleLogin}>Sign in with Google</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col gap-8">
        {/* Enhanced Header Section */}
        <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6 flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-600 to-zinc-600 dark:from-zinc-400 dark:to-zinc-400 bg-clip-text text-transparent flex items-center justify-between gap-2">
              Debtly
              <div className="flex gap-3 items-center ml-4">
                <span className="text-base font-medium text-zinc-700 dark:text-zinc-300">
                  Hi, {user.displayName}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleLogout}
                  className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <LogOut className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </Button>
              </div>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Keep track of money you owe and money owed to you
            </p>
          </div>

          {/* Actions Menu - Dropdown for Mobile, Expanded for Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => exportData("json")}
              className="flex items-center gap-2 bg-white/80 dark:bg-zinc-900/80 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 transition-all"
            >
              <Download className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => exportData("csv")}
              className="flex items-center gap-2 bg-white/80 dark:bg-zinc-900/80 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 transition-all"
            >
              <Download className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              Export CSV
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-white/80 dark:bg-zinc-900/80 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 transition-all"
              >
                <input
                  type="file"
                  accept=".json"
                  id="import-json"
                  className="absolute inset-0 opacity-0 w-full cursor-pointer"
                  onChange={importData}
                />
                <Upload className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                Import JSON
              </Button>
            </div>
          </div>

          {/* Mobile Dropdown */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild className="md:hidden self-end">
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm"
              >
                <Settings className="h-4 w-4 mr-2 text-zinc-600 dark:text-zinc-400" />
                Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-lg"
            >
              <DropdownMenuItem
                onClick={() => exportData("json")}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2 text-zinc-600 dark:text-zinc-400" />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportData("csv")}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2 text-zinc-600 dark:text-zinc-400" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer relative"
              >
                <label
                  htmlFor="mobile-import-json"
                  className="flex items-center cursor-pointer w-full"
                >
                  <Upload className="h-4 w-4 mr-2 text-zinc-600 dark:text-zinc-400" />
                  Import JSON
                </label>
                <input
                  type="file"
                  accept=".json"
                  id="mobile-import-json"
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  onChange={(event) => {
                    importData(event);
                    setIsDropdownOpen(false);
                  }}
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
