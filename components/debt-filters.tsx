"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Filter, ArrowUpDown, X, AlertCircle } from "lucide-react";
import type { Person, Debt } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface DebtFiltersProps {
  people: Person[];
  filters: {
    personId: string;
    status: string;
    minAmount: string;
    maxAmount: string;
    type: string;
    overdue: boolean;
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      personId: string;
      status: string;
      minAmount: string;
      maxAmount: string;
      type: string;
      overdue: boolean;
    }>
  >;
  sorting: {
    field: keyof Debt | "personName" | "dueDate";
    direction: "asc" | "desc";
  };
  setSorting: React.Dispatch<
    React.SetStateAction<{
      field: keyof Debt | "personName" | "dueDate";
      direction: "asc" | "desc";
    }>
  >;
  overdueCount: number;
}

export function DebtFilters({
  people,
  filters,
  setFilters,
  sorting,
  setSorting,
  overdueCount,
}: DebtFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const resetFilters = () => {
    setFilters({
      personId: "",
      status: "",
      minAmount: "",
      maxAmount: "",
      type: "",
      overdue: false,
    });
  };

  const hasActiveFilters =
    filters.personId ||
    filters.status ||
    filters.minAmount ||
    filters.maxAmount ||
    filters.type ||
    filters.overdue;

  return (
    <div className="flex flex-wrap gap-2 items-center justify-between">
      <div className="flex flex-wrap gap-2">
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              aria-expanded={isFilterOpen}
            >
              <Filter className="h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <span className="ml-1 rounded-full bg-primary w-2 h-2" />
              )}
              {filters.overdue && (
                <Badge
                  variant="outline"
                  className="ml-1 px-1 py-0 h-5 text-xs border-red-500 text-red-500"
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Filters</h4>
                <p className="text-sm text-muted-foreground">
                  Filter transactions by various criteria
                </p>
              </div>

              <div className="grid gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="filter-type">Transaction Type</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) =>
                      setFilters({ ...filters, type: value })
                    }
                  >
                    <SelectTrigger id="filter-type">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_types">All types</SelectItem>
                      <SelectItem value="they-owe">They owe you</SelectItem>
                      <SelectItem value="you-owe">You owe them</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="filter-person">Person</Label>
                  <Select
                    value={filters.personId}
                    onValueChange={(value) =>
                      setFilters({ ...filters, personId: value })
                    }
                  >
                    <SelectTrigger id="filter-person">
                      <SelectValue placeholder="All people" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_people">All people</SelectItem>
                      {people.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="filter-status">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters({ ...filters, status: value })
                    }
                  >
                    <SelectTrigger id="filter-status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_statuses">All statuses</SelectItem>
                      <SelectItem value="given">
                        They Owe - Outstanding
                      </SelectItem>
                      <SelectItem value="payed back">
                        They Owe - Paid Back
                      </SelectItem>
                      <SelectItem value="borrowed">
                        You Owe - Outstanding
                      </SelectItem>
                      <SelectItem value="returned">
                        You Owe - Returned
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <Label htmlFor="min-amount">Min Amount</Label>
                    <Input
                      id="min-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Min"
                      value={filters.minAmount}
                      onChange={(e) =>
                        setFilters({ ...filters, minAmount: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="max-amount">Max Amount</Label>
                    <Input
                      id="max-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Max"
                      value={filters.maxAmount}
                      onChange={(e) =>
                        setFilters({ ...filters, maxAmount: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="overdue-filter"
                    checked={filters.overdue}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, overdue: checked })
                    }
                  />
                  <Label htmlFor="overdue-filter" className="flex items-center">
                    <span>Show overdue only</span>
                    {overdueCount > 0 && (
                      <Badge
                        variant="outline"
                        className="ml-2 px-1 py-0 h-5 text-xs border-red-500 text-red-500"
                      >
                        {overdueCount}
                      </Badge>
                    )}
                  </Label>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                >
                  Reset
                </Button>
                <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={isSortOpen} onOpenChange={setIsSortOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              aria-expanded={isSortOpen}
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Sort</h4>
                <p className="text-sm text-muted-foreground">
                  Sort transactions by various criteria
                </p>
              </div>

              <div className="grid gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="sort-field">Sort By</Label>
                  <Select
                    value={sorting.field}
                    onValueChange={(value) =>
                      setSorting({
                        ...sorting,
                        field: value as keyof Debt | "personName" | "dueDate",
                      })
                    }
                  >
                    <SelectTrigger id="sort-field">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Transaction Date</SelectItem>
                      <SelectItem value="dueDate">Due Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="personName">Person Name</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="sort-direction">Direction</Label>
                  <Select
                    value={sorting.direction}
                    onValueChange={(value) =>
                      setSorting({
                        ...sorting,
                        direction: value as "asc" | "desc",
                      })
                    }
                  >
                    <SelectTrigger id="sort-direction">
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button size="sm" onClick={() => setIsSortOpen(false)}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={resetFilters}
        >
          <X className="h-3 w-3 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
