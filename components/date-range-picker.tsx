import React from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  dateRange: { from?: Date; to?: Date };
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateRange.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange.from ? (
            dateRange.to ? (
              <span>
                {format(dateRange.from, "MMM dd, yyyy")} -{" "}
                {format(dateRange.to, "MMM dd, yyyy")}
              </span>
            ) : (
              format(dateRange.from, "MMM dd, yyyy")
            )
          ) : (
            <span>Pick a date range</span>
          )}
          {(dateRange.from || dateRange.to) && (
            <X 
              className="ml-auto h-4 w-4 opacity-70 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onDateRangeChange({ from: undefined, to: undefined });
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b border-border">
          <h4 className="font-medium">Select Date Range</h4>
          <p className="text-sm text-muted-foreground">
            Choose start and end dates
          </p>
        </div>
        <Calendar
          mode="range"
          selected={{ from: dateRange.from, to: dateRange.to }}
          onSelect={(range) =>
            onDateRangeChange(range || { from: undefined, to: undefined })
          }
          numberOfMonths={2}
          className="p-3"
        />
        <div className="flex justify-end gap-2 p-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateRangeChange({ from: undefined, to: undefined })}
            className="text-xs"
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}