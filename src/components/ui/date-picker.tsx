"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date | null;
  onDateChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showIcon?: boolean;
  variant?: "default" | "compact" | "inline";
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
  showIcon = true,
  variant = "default",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const isOverdue = date && date < new Date() && format(date, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd');
  const isToday = date && format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isDueSoon = date && !isOverdue && !isToday && date <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const getDateColor = () => {
    if (isOverdue) return "text-red-400 border-red-500/50";
    if (isToday) return "text-yellow-400 border-yellow-500/50";
    if (isDueSoon) return "text-orange-400 border-orange-500/50";
    return "text-gray-300 border-gray-600";
  };

  const getDateIcon = () => {
    if (isOverdue) return <AlertTriangle className="h-3 w-3" />;
    if (isToday) return <Clock className="h-3 w-3" />;
    return <CalendarIcon className="h-3 w-3" />;
  };

  const formatDisplayDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = format(date, 'yyyy-MM-dd');
    const todayStr = format(today, 'yyyy-MM-dd');
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    if (dateStr === todayStr) return "Today";
    if (dateStr === tomorrowStr) return "Tomorrow";
    if (dateStr === yesterdayStr) return "Yesterday";
    
    return format(date, "d MMM");
  };

  if (variant === "inline") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "justify-start text-left font-normal px-2 py-1 h-auto min-h-0",
              !date && "text-gray-500",
              getDateColor(),
              className
            )}
            disabled={disabled}
          >
            <div className="flex items-center space-x-1">
              {showIcon && getDateIcon()}
              <span className="text-sm">
                {date ? formatDisplayDate(date) : placeholder}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
          <Calendar
            mode="single"
            selected={date || undefined}
            onSelect={(selectedDate) => {
              onDateChange(selectedDate || null);
              setOpen(false);
            }}
            disabled={disabled}
            initialFocus
            className="bg-gray-800 text-white"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center text-white",
              caption_label: "text-sm font-medium text-white",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-blue-600 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-white hover:bg-gray-700 rounded-md",
              day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
              day_today: "bg-gray-700 text-white",
              day_outside: "text-gray-500 opacity-50",
              day_disabled: "text-gray-500 opacity-50",
              day_range_middle: "aria-selected:bg-blue-600 aria-selected:text-white",
              day_hidden: "invisible",
            }}
          />
          {date && (
            <div className="p-3 border-t border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDateChange(null);
                  setOpen(false);
                }}
                className="w-full text-gray-400 hover:text-gray-300"
              >
                Clear date
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  if (variant === "compact") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal h-8 px-2",
              !date && "text-gray-500",
              getDateColor(),
              "bg-gray-800 border-gray-700 hover:bg-gray-700",
              className
            )}
            disabled={disabled}
          >
            <div className="flex items-center space-x-1">
              {showIcon && getDateIcon()}
              <span className="text-xs">
                {date ? formatDisplayDate(date) : placeholder}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
          <Calendar
            mode="single"
            selected={date || undefined}
            onSelect={(selectedDate) => {
              onDateChange(selectedDate || null);
              setOpen(false);
            }}
            disabled={disabled}
            initialFocus
            className="bg-gray-800 text-white"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center text-white",
              caption_label: "text-sm font-medium text-white",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-blue-600 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-white hover:bg-gray-700 rounded-md",
              day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
              day_today: "bg-gray-700 text-white",
              day_outside: "text-gray-500 opacity-50",
              day_disabled: "text-gray-500 opacity-50",
              day_range_middle: "aria-selected:bg-blue-600 aria-selected:text-white",
              day_hidden: "invisible",
            }}
          />
          {date && (
            <div className="p-3 border-t border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDateChange(null);
                  setOpen(false);
                }}
                className="w-full text-gray-400 hover:text-gray-300"
              >
                Clear date
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !date && "text-gray-500",
            getDateColor(),
            "bg-gray-800 border-gray-700 hover:bg-gray-700",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center space-x-2">
            {showIcon && getDateIcon()}
            <span>
              {date ? formatDisplayDate(date) : placeholder}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
        <Calendar
          mode="single"
          selected={date || undefined}
          onSelect={(selectedDate) => {
            onDateChange(selectedDate || null);
            setOpen(false);
          }}
          disabled={disabled}
          initialFocus
          className="bg-gray-800 text-white"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center text-white",
            caption_label: "text-sm font-medium text-white",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-blue-600 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-white hover:bg-gray-700 rounded-md",
            day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
            day_today: "bg-gray-700 text-white",
            day_outside: "text-gray-500 opacity-50",
            day_disabled: "text-gray-500 opacity-50",
            day_range_middle: "aria-selected:bg-blue-600 aria-selected:text-white",
            day_hidden: "invisible",
          }}
        />
        {date && (
          <div className="p-3 border-t border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDateChange(null);
                setOpen(false);
              }}
              className="w-full text-gray-400 hover:text-gray-300"
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
