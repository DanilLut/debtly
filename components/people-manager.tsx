"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, CreditCard, Users, UserPlus } from "lucide-react";
import type { Person, Debt } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface PeopleManagerProps {
  people: Person[];
  setPeople: React.Dispatch<React.SetStateAction<Person[]>>;
  debts: Debt[];
  onAddDebt: (personId: string, isBorrowed: boolean) => void;
}

export function PeopleManager({
  people,
  setPeople,
  debts,
  onAddDebt,
}: PeopleManagerProps) {
  const [newPersonName, setNewPersonName] = useState("");
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editedName, setEditedName] = useState("");

  const addPerson = () => {
    if (newPersonName.trim() === "") return;

    const newPerson: Person = {
      id: crypto.randomUUID(),
      name: newPersonName.trim(),
    };

    setPeople([...people, newPerson]);
    setNewPersonName("");
  };

  const removePerson = (person: Person) => {
    const hasDebts = debts.some((debt) => debt.personId === person.id);

    if (hasDebts) {
      setPersonToDelete(person);
    } else {
      setPeople(people.filter((p) => p.id !== person.id));
    }
  };

  const confirmDeletePerson = () => {
    if (!personToDelete) return;

    setPeople(people.filter((p) => p.id !== personToDelete.id));
    setPersonToDelete(null);
  };

  const startEditPerson = (person: Person) => {
    setEditingPerson(person);
    setEditedName(person.name);
  };

  const saveEditedPerson = () => {
    if (!editingPerson || editedName.trim() === "") return;

    setPeople(
      people.map((person) =>
        person.id === editingPerson.id
          ? { ...person, name: editedName.trim() }
          : person,
      ),
    );

    setEditingPerson(null);
    setEditedName("");
  };

  // Calculate debt information for each person
  const getPersonDebts = (personId: string) => {
    const personDebts = debts.filter((debt) => debt.personId === personId);

    // They owe you
    const outstandingDebts = personDebts.filter(
      (debt) => debt.status === "given",
    );
    const paidDebts = personDebts.filter(
      (debt) => debt.status === "payed back",
    );

    // You owe them
    const borrowedDebts = personDebts.filter(
      (debt) => debt.status === "borrowed",
    );
    const returnedDebts = personDebts.filter(
      (debt) => debt.status === "returned",
    );

    const totalOutstanding = outstandingDebts.reduce(
      (sum, debt) => sum + debt.amount,
      0,
    );
    const totalPaid = paidDebts.reduce((sum, debt) => sum + debt.amount, 0);
    const totalBorrowed = borrowedDebts.reduce(
      (sum, debt) => sum + debt.amount,
      0,
    );
    const totalReturned = returnedDebts.reduce(
      (sum, debt) => sum + debt.amount,
      0,
    );

    return {
      totalDebts: personDebts.length,
      outstandingCount: outstandingDebts.length,
      paidCount: paidDebts.length,
      borrowedCount: borrowedDebts.length,
      returnedCount: returnedDebts.length,
      totalOutstanding,
      totalPaid,
      totalBorrowed,
      totalReturned,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">People</h2>

        <div className="flex gap-2">
          <Input
            placeholder="Enter person's name"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addPerson();
              }
            }}
          />
          <Button
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            onClick={addPerson}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            New Person
          </Button>
        </div>
      </div>

      {people.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {people.map((person) => {
            const personDebts = getPersonDebts(person.id);
            const netBalance =
              personDebts.totalOutstanding - personDebts.totalBorrowed;
            const hasDebts = personDebts.totalDebts > 0;

            return (
              <Card
                key={person.id}
                className="overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                {/* Card Header with gradient background */}
                <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 dark:from-zinc-900 dark:to-zinc-950 p-4 border-b">
                  <div className="flex justify-between items-start flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{person.name}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => startEditPerson(person)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <div className="relative group">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs bg-white dark:bg-zinc-800 hover:bg-violet-50 dark:hover:bg-zinc-700"
                          onClick={() => onAddDebt(person.id, false)}
                        >
                          <Plus className="h-3 w-3 mr-1.5 text-green-600" />
                          They owe
                        </Button>
                      </div>
                      <div className="relative group">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs bg-white dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-zinc-700"
                          onClick={() => onAddDebt(person.id, true)}
                        >
                          <Plus className="h-3 w-3 mr-1.5 text-red-500" />
                          You owe
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 transition-colors"
                        onClick={() => removePerson(person)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  {hasDebts ? (
                    <div className="space-y-4">
                      {/* They owe you section */}
                      {(personDebts.outstandingCount > 0 ||
                        personDebts.paidCount > 0) && (
                        <div className="space-y-2.5 bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                          <h4 className="text-sm font-medium flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            They owe you:
                          </h4>

                          {personDebts.outstandingCount > 0 && (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="default"
                                  className="h-5 bg-green-500 hover:bg-green-600"
                                >
                                  {personDebts.outstandingCount}
                                </Badge>
                                <span className="text-sm">Outstanding</span>
                              </div>
                              <span className="font-medium text-green-700 dark:text-green-400">
                                {formatCurrency(personDebts.totalOutstanding)}
                              </span>
                            </div>
                          )}

                          {personDebts.paidCount > 0 && (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className="h-5 border-green-300 text-green-700 dark:border-green-700 dark:text-green-400"
                                >
                                  {personDebts.paidCount}
                                </Badge>
                                <span className="text-sm">Paid back</span>
                              </div>
                              <span className="font-medium text-muted-foreground">
                                {formatCurrency(personDebts.totalPaid)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* You owe them section */}
                      {(personDebts.borrowedCount > 0 ||
                        personDebts.returnedCount > 0) && (
                        <div className="space-y-2.5 bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
                          <h4 className="text-sm font-medium flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            You owe them:
                          </h4>

                          {personDebts.borrowedCount > 0 && (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <Badge variant="destructive" className="h-5">
                                  {personDebts.borrowedCount}
                                </Badge>
                                <span className="text-sm">Outstanding</span>
                              </div>
                              <span className="font-medium text-red-700 dark:text-red-400">
                                {formatCurrency(personDebts.totalBorrowed)}
                              </span>
                            </div>
                          )}

                          {personDebts.returnedCount > 0 && (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className="h-5 border-red-300 text-red-700 dark:border-red-700 dark:text-red-400"
                                >
                                  {personDebts.returnedCount}
                                </Badge>
                                <span className="text-sm">Returned</span>
                              </div>
                              <span className="font-medium text-muted-foreground">
                                {formatCurrency(personDebts.totalReturned)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Net balance */}
                      <div className="pt-3 mt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Net balance:</span>
                          <span
                            className={`font-bold text-lg ${
                              netBalance > 0
                                ? "text-green-600 dark:text-green-400"
                                : netBalance < 0
                                  ? "text-red-600 dark:text-red-400"
                                  : ""
                            }`}
                          >
                            {formatCurrency(netBalance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                        <CreditCard className="h-6 w-6 text-zinc-400" />
                      </div>
                      <p className="text-sm">No debts recorded</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 px-4 text-muted-foreground bg-zinc-50 dark:bg-zinc-900 rounded-lg">
          <div className="mx-auto w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-zinc-400" />
          </div>
          <p className="text-lg mb-2">No people added yet</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Add someone to get started tracking debts
          </p>
        </div>
      )}

      {/* Delete Person Dialog */}
      <AlertDialog
        open={!!personToDelete}
        onOpenChange={() => setPersonToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This person has debts associated with them. Deleting them will
              remove all their debt records as well.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePerson}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Person Dialog */}
      <Dialog
        open={!!editingPerson}
        onOpenChange={(open) => {
          if (!open) setEditingPerson(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Person</DialogTitle>
            <DialogDescription>
              Update the person's name below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    saveEditedPerson();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={saveEditedPerson}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
