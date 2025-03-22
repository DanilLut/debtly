"use client";

import type React from "react";

import { useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  Edit,
  Calendar,
  AlertCircle,
  Clock,
  Check,
  X,
  CreditCard,
  ArrowDownRight,
  ArrowUpRight,
  BarChart,
  Scale,
  Plus,
} from "lucide-react";
import type { Person, Debt, DebtStatus } from "@/lib/types";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";
import { DebtFilters } from "@/components/debt-filters";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

interface DebtManagerProps {
  people: Person[];
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
}

export const DebtManager = forwardRef<
  { initFormForPerson: (personId: string, isBorrowed: boolean) => void },
  DebtManagerProps
>(({ people, debts, setDebts }, ref) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [newDebt, setNewDebt] = useState<{
    personId: string;
    amount: string;
    description: string;
    date: string;
    expectedReturnDate?: string;
    includeExpectedDate: boolean;
    status: DebtStatus;
  }>({
    personId: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    expectedReturnDate: "",
    includeExpectedDate: false,
    status: "given",
  });
  const [debtType, setDebtType] = useState<"they-owe" | "you-owe">("they-owe");

  // Expose the initFormForPerson method to parent components
  useImperativeHandle(ref, () => ({
    initFormForPerson: (personId: string, isBorrowed: boolean) => {
      setNewDebt({
        personId,
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        expectedReturnDate: "",
        includeExpectedDate: false,
        status: isBorrowed ? "borrowed" : "given",
      });
      setDebtType(isBorrowed ? "you-owe" : "they-owe");
      setIsAddDialogOpen(true);
    },
  }));

  // Filters and sorting
  const [filters, setFilters] = useState({
    personId: "",
    status: "",
    minAmount: "",
    maxAmount: "",
    type: "", // "they-owe" or "you-owe"
    overdue: false, // Filter for overdue debts
  });
  const [sorting, setSorting] = useState({
    field: "date" as keyof Debt | "personName" | "dueDate",
    direction: "desc" as "asc" | "desc",
  });

  // Reset form when dialog closes
  const resetForm = () => {
    setNewDebt({
      personId: "",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      expectedReturnDate: "",
      includeExpectedDate: false,
      status: "given",
    });
    setDebtType("they-owe");
    setEditingDebt(null);
  };

  // Add new debt
  const addDebt = () => {
    if (!newDebt.personId || !newDebt.amount || !newDebt.date) return;

    // Set the correct status based on debt type
    const status = debtType === "they-owe" ? "given" : "borrowed";

    const debtToAdd: Debt = {
      id: crypto.randomUUID(),
      personId: newDebt.personId,
      amount: Number.parseFloat(newDebt.amount),
      description: newDebt.description || "",
      date: newDebt.date,
      status: newDebt.status || status,
    };

    // Add expected return date if included
    if (newDebt.includeExpectedDate && newDebt.expectedReturnDate) {
      debtToAdd.expectedReturnDate = newDebt.expectedReturnDate;
    }

    setDebts([...debts, debtToAdd]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  // Update existing debt
  const updateDebt = () => {
    if (!editingDebt || !newDebt.personId || !newDebt.amount || !newDebt.date)
      return;

    // Determine if this is a "they owe" or "you owe" type
    const isTheyOwe =
      newDebt.status === "given" || newDebt.status === "payed back";
    const isYouOwe =
      newDebt.status === "borrowed" || newDebt.status === "returned";

    // Make sure the status is consistent with the debt type
    let status = newDebt.status;
    if (debtType === "they-owe" && isYouOwe) {
      status = "given";
    } else if (debtType === "you-owe" && isTheyOwe) {
      status = "borrowed";
    }

    const updatedDebt: Debt = {
      ...editingDebt,
      personId: newDebt.personId,
      amount: Number.parseFloat(newDebt.amount),
      description: newDebt.description || "",
      date: newDebt.date,
      status,
    };

    // Update expected return date
    if (newDebt.includeExpectedDate && newDebt.expectedReturnDate) {
      updatedDebt.expectedReturnDate = newDebt.expectedReturnDate;
    } else {
      // Remove expected return date if not included
      delete updatedDebt.expectedReturnDate;
    }

    setDebts(
      debts.map((debt) => (debt.id === editingDebt.id ? updatedDebt : debt)),
    );
    setIsAddDialogOpen(false);
    resetForm();
  };

  // Remove debt
  const removeDebt = (id: string) => {
    setDebts(debts.filter((debt) => debt.id !== id));
  };

  // Remove all paid debts
  const removeAllPaidDebts = () => {
    const updatedDebts = debts.filter(
      (debt) => debt.status !== "payed back" && debt.status !== "returned",
    );
    setDebts(updatedDebts);
  };

  // Toggle debt status
  const toggleDebtStatus = (id: string) => {
    setDebts(
      debts.map((debt) => {
        if (debt.id === id) {
          // Toggle between appropriate statuses based on debt type
          let newStatus: DebtStatus;
          if (debt.status === "given") {
            newStatus = "payed back";
          } else if (debt.status === "payed back") {
            newStatus = "given";
          } else if (debt.status === "borrowed") {
            newStatus = "returned";
          } else {
            newStatus = "borrowed";
          }

          return {
            ...debt,
            status: newStatus,
          };
        }
        return debt;
      }),
    );
  };

  // Edit debt
  const startEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setNewDebt({
      personId: debt.personId,
      amount: debt.amount.toString(),
      description: debt.description,
      date: debt.date,
      expectedReturnDate: debt.expectedReturnDate || "",
      includeExpectedDate: !!debt.expectedReturnDate,
      status: debt.status,
    });

    // Set the debt type based on the status
    if (debt.status === "given" || debt.status === "payed back") {
      setDebtType("they-owe");
    } else {
      setDebtType("you-owe");
    }

    setIsAddDialogOpen(true);
  };

  // Apply filters and sorting
  const filteredAndSortedDebts = useMemo(() => {
    // First apply filters
    const result = debts.filter((debt) => {
      // Filter by person
      if (filters.personId && debt.personId !== filters.personId) {
        return false;
      }

      // Filter by status
      if (filters.status && debt.status !== filters.status) {
        return false;
      }

      // Filter by type (they owe or you owe)
      if (
        filters.type === "they-owe" &&
        (debt.status === "borrowed" || debt.status === "returned")
      ) {
        return false;
      }
      if (
        filters.type === "you-owe" &&
        (debt.status === "given" || debt.status === "payed back")
      ) {
        return false;
      }

      // Filter by overdue
      if (filters.overdue) {
        // Only include active debts with an expected return date that is in the past
        const isActive = debt.status === "given" || debt.status === "borrowed";
        if (
          !isActive ||
          !debt.expectedReturnDate ||
          !isOverdue(debt.expectedReturnDate)
        ) {
          return false;
        }
      }

      // Filter by min amount
      if (
        filters.minAmount &&
        debt.amount < Number.parseFloat(filters.minAmount)
      ) {
        return false;
      }

      // Filter by max amount
      if (
        filters.maxAmount &&
        debt.amount > Number.parseFloat(filters.maxAmount)
      ) {
        return false;
      }

      return true;
    });

    // Then apply sorting
    result.sort((a, b) => {
      if (sorting.field === "personName") {
        const personA = people.find((p) => p.id === a.personId)?.name || "";
        const personB = people.find((p) => p.id === b.personId)?.name || "";
        return sorting.direction === "asc"
          ? personA.localeCompare(personB)
          : personB.localeCompare(personA);
      }

      if (sorting.field === "date") {
        return sorting.direction === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      }

      if (sorting.field === "dueDate") {
        // Handle cases where one or both debts don't have expected return dates
        if (!a.expectedReturnDate && !b.expectedReturnDate) return 0;
        if (!a.expectedReturnDate) return sorting.direction === "asc" ? 1 : -1;
        if (!b.expectedReturnDate) return sorting.direction === "asc" ? -1 : 1;

        return sorting.direction === "asc"
          ? new Date(a.expectedReturnDate).getTime() -
              new Date(b.expectedReturnDate).getTime()
          : new Date(b.expectedReturnDate).getTime() -
              new Date(a.expectedReturnDate).getTime();
      }

      if (sorting.field === "amount") {
        return sorting.direction === "asc"
          ? a.amount - b.amount
          : b.amount - a.amount;
      }

      return 0;
    });

    return result;
  }, [debts, filters, sorting, people]);

  // Count of debts by type and status
  const debtStats = useMemo(() => {
    // They owe you
    const given = debts.filter((debt) => debt.status === "given");
    const paidBack = debts.filter((debt) => debt.status === "payed back");

    // You owe them
    const borrowed = debts.filter((debt) => debt.status === "borrowed");
    const returned = debts.filter((debt) => debt.status === "returned");

    // Count overdue debts
    const overdueDebts = debts.filter((debt) => {
      const isActive = debt.status === "given" || debt.status === "borrowed";
      return (
        isActive &&
        debt.expectedReturnDate &&
        isOverdue(debt.expectedReturnDate)
      );
    });

    const totalGiven = given.reduce((sum, debt) => sum + debt.amount, 0);
    const totalBorrowed = borrowed.reduce((sum, debt) => sum + debt.amount, 0);

    return {
      givenCount: given.length,
      paidBackCount: paidBack.length,
      borrowedCount: borrowed.length,
      returnedCount: returned.length,
      overdueCount: overdueDebts.length,
      totalOutstanding: totalGiven, // What others owe you
      totalOwed: totalBorrowed, // What you owe others
      netBalance: totalGiven - totalBorrowed, // Positive means others owe you more
    };
  }, [debts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-2xl font-semibold">Transactions</h2>

          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={
                    !debts.some(
                      (debt) =>
                        debt.status === "payed back" ||
                        debt.status === "returned",
                    )
                  }
                >
                  Remove All Settled
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all debts with "Paid Back" or "Returned"
                    status. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={removeAllPaidDebts}>
                    Remove All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={people.length === 0}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingDebt ? "Edit Transaction" : "Add New Transaction"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingDebt
                      ? "Update the transaction details below."
                      : "Enter the details of the transaction below."}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <Tabs
                    value={debtType}
                    onValueChange={(value) => {
                      setDebtType(value as "they-owe" | "you-owe");
                      // Update the status based on the selected type
                      if (value === "they-owe") {
                        setNewDebt({
                          ...newDebt,
                          status:
                            editingDebt?.status === "payed back"
                              ? "payed back"
                              : "given",
                        });
                      } else {
                        setNewDebt({
                          ...newDebt,
                          status:
                            editingDebt?.status === "returned"
                              ? "returned"
                              : "borrowed",
                        });
                      }
                    }}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="they-owe">They Owe You</TabsTrigger>
                      <TabsTrigger value="you-owe">You Owe Them</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="grid gap-2">
                    <Label htmlFor="person">Person</Label>
                    <Select
                      value={newDebt.personId}
                      onValueChange={(value) =>
                        setNewDebt({
                          ...newDebt,
                          personId: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select person" />
                      </SelectTrigger>
                      <SelectContent>
                        {people.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter amount"
                      value={newDebt.amount}
                      onChange={(e) =>
                        setNewDebt({
                          ...newDebt,
                          amount: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="What is this transaction for?"
                      value={newDebt.description}
                      onChange={(e) =>
                        setNewDebt({
                          ...newDebt,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="date">Transaction Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newDebt.date}
                      onChange={(e) =>
                        setNewDebt({
                          ...newDebt,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-expected-date"
                      checked={newDebt.includeExpectedDate}
                      onCheckedChange={(checked) => {
                        setNewDebt({
                          ...newDebt,
                          includeExpectedDate: checked as boolean,
                          expectedReturnDate: checked
                            ? newDebt.expectedReturnDate ||
                              new Date().toISOString().split("T")[0]
                            : "",
                        });
                      }}
                    />
                    <Label
                      htmlFor="include-expected-date"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Set expected return date
                    </Label>
                  </div>

                  {newDebt.includeExpectedDate && (
                    <div className="grid gap-2">
                      <Label htmlFor="expected-return-date">
                        Expected Return Date
                      </Label>
                      <Input
                        id="expected-return-date"
                        type="date"
                        value={newDebt.expectedReturnDate}
                        onChange={(e) =>
                          setNewDebt({
                            ...newDebt,
                            expectedReturnDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newDebt.status}
                      onValueChange={(value) =>
                        setNewDebt({
                          ...newDebt,
                          status: value as DebtStatus,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {debtType === "they-owe" ? (
                          <>
                            <SelectItem value="given">Outstanding</SelectItem>
                            <SelectItem value="payed back">
                              Paid Back
                            </SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="borrowed">
                              Outstanding
                            </SelectItem>
                            <SelectItem value="returned">Returned</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={editingDebt ? updateDebt : addDebt}>
                    {editingDebt ? "Update" : "Add"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {/* Total Transactions Card */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 py-3 px-4 border-b border-zinc-200 dark:border-zinc-700">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Total Transactions
              </h3>
            </div>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <BarChart className="h-5 w-5 text-zinc-500" />
              </div>
              <div>
                <div className="text-3xl font-bold">{debts.length}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {debts.length === 1 ? "Transaction" : "Transactions"} recorded
                </div>
              </div>
            </CardContent>
          </Card>

          {/* They Owe You Card */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="bg-gradient-to-br from-green-50 to-zinc-50 dark:from-green-950/30 dark:to-zinc-950 py-3 px-4 border-b border-green-100 dark:border-green-900/50">
              <h3 className="text-sm font-medium text-green-600 dark:text-green-400">
                They Owe You
              </h3>
            </div>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(debtStats.totalOutstanding)}
                </div>
                <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                  Money coming in
                </div>
              </div>
            </CardContent>
          </Card>

          {/* You Owe Them Card */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="bg-gradient-to-br from-red-50 to-zinc-50 dark:from-red-950/30 dark:to-zinc-950 py-3 px-4 border-b border-red-100 dark:border-red-900/50">
              <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
                You Owe Them
              </h3>
            </div>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(debtStats.totalOwed)}
                </div>
                <div className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                  Money going out
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Balance Card */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div
              className={`bg-gradient-to-r py-3 px-4 border-b ${
                debtStats.netBalance > 0
                  ? "from-green-50 to-zinc-50 dark:from-green-950/30 dark:to-zinc-950 border-green-100 dark:border-green-900/50"
                  : debtStats.netBalance < 0
                    ? "from-red-50 to-zinc-50 dark:from-red-950/30 dark:to-zinc-950 border-red-100 dark:border-red-900/50"
                    : "from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <h3
                className={`text-sm font-medium ${
                  debtStats.netBalance > 0
                    ? "text-green-600 dark:text-green-400"
                    : debtStats.netBalance < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                Net Balance
              </h3>
            </div>
            <CardContent className="p-4 flex items-center space-x-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  debtStats.netBalance > 0
                    ? "bg-green-100 dark:bg-green-900/30"
                    : debtStats.netBalance < 0
                      ? "bg-red-100 dark:bg-red-900/30"
                      : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              >
                <Scale
                  className={`h-5 w-5 ${
                    debtStats.netBalance > 0
                      ? "text-green-600 dark:text-green-400"
                      : debtStats.netBalance < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-zinc-500"
                  }`}
                />
              </div>
              <div>
                <div
                  className={`text-3xl font-bold ${
                    debtStats.netBalance > 0
                      ? "text-green-600 dark:text-green-400"
                      : debtStats.netBalance < 0
                        ? "text-red-600 dark:text-red-400"
                        : ""
                  }`}
                >
                  {formatCurrency(debtStats.netBalance)}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    debtStats.netBalance > 0
                      ? "text-green-600/70 dark:text-green-400/70"
                      : debtStats.netBalance < 0
                        ? "text-red-600/70 dark:text-red-400/70"
                        : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {debtStats.netBalance > 0
                    ? "Net positive balance"
                    : debtStats.netBalance < 0
                      ? "Net negative balance"
                      : "Balanced"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DebtFilters
        people={people}
        filters={filters}
        setFilters={setFilters}
        sorting={sorting}
        setSorting={setSorting}
        overdueCount={debtStats.overdueCount}
      />

      {filteredAndSortedDebts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredAndSortedDebts.map((debt) => {
            const person = people.find((p) => p.id === debt.personId);
            const isTheyOwe =
              debt.status === "given" || debt.status === "payed back";
            const isSettled =
              debt.status === "payed back" || debt.status === "returned";
            const isActive = !isSettled;
            const isOverdueDebt =
              isActive &&
              debt.expectedReturnDate &&
              isOverdue(debt.expectedReturnDate);

            return (
              <Card
                key={debt.id}
                className={`overflow-hidden hover:shadow-md transition-shadow duration-300 ${
                  isSettled ? "opacity-75" : ""
                }`}
              >
                {/* Streamlined Card Header */}
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 border-b">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">
                      {person?.name || "Unknown Person"}
                    </h3>
                    {isOverdueDebt && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
                            <p className="flex items-center gap-1 text-xs">
                              <Clock className="h-3 w-3" />
                              Payment Overdue
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <Badge
                    variant={isSettled ? "outline" : "default"}
                    className={`px-2 py-0.5 text-xs ${
                      isSettled
                        ? isTheyOwe
                          ? "border-green-300 text-green-700 dark:border-green-700 dark:text-green-400"
                          : "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400"
                        : isTheyOwe
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                  >
                    {isTheyOwe
                      ? debt.status === "given"
                        ? "They Owe You"
                        : "Paid Back"
                      : debt.status === "borrowed"
                        ? "You Owe Them"
                        : "Returned"}
                  </Badge>
                </div>

                {/* Compact Content Area */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold">
                        {formatCurrency(debt.amount)}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isTheyOwe
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {isTheyOwe ? "+ Income" : "- Expense"}
                      </span>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={() => toggleDebtStatus(debt.id)}
                      >
                        {isSettled ? (
                          <X className="h-3.5 w-3.5" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={() => startEditDebt(debt)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600"
                        onClick={() => removeDebt(debt.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Description (only if present) */}
                  {debt.description && (
                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded px-2.5 py-1.5 mb-2 border border-zinc-100 dark:border-zinc-800 text-sm text-zinc-600 dark:text-zinc-300">
                      {debt.description}
                    </div>
                  )}

                  {/* Date information */}
                  <div className="flex flex-wrap text-xs gap-x-4 mt-1 text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatDate(debt.date)}</span>
                    </div>

                    {debt.expectedReturnDate && (
                      <div
                        className={`flex items-center ${
                          isOverdueDebt ? "text-red-500" : ""
                        }`}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Due: {formatDate(debt.expectedReturnDate)}</span>
                        {isOverdueDebt && (
                          <span className="ml-1">(Overdue)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 px-4 text-muted-foreground bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800">
          <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
            <CreditCard className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="text-base mb-1">
            {debts.length === 0
              ? "No transactions added yet"
              : "No transactions match your filters"}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {debts.length === 0
              ? "Add a transaction to get started tracking debts"
              : "Try adjusting your filter criteria"}
          </p>
        </div>
      )}
    </div>
  );
});

DebtManager.displayName = "DebtManager"; //
