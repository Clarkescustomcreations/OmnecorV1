import React, { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useLocation } from "wouter";
import {
  Brain,
  MessageCircle,
  Zap,
  GitBranch,
  Plug,
  Settings,
  Search,
} from "lucide-react";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (path: string) => {
    setOpen(false);
    setLocation(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand("/chat")}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Chat
          </CommandItem>
          <CommandItem onSelect={() => runCommand("/brain-map")}>
            <Brain className="mr-2 h-4 w-4" />
            Neural Brain Map
          </CommandItem>
          <CommandItem onSelect={() => runCommand("/model-hub")}>
            <Zap className="mr-2 h-4 w-4" />
            Model Hub
          </CommandItem>
          <CommandItem onSelect={() => runCommand("/pipelines")}>
            <GitBranch className="mr-2 h-4 w-4" />
            Pipelines
          </CommandItem>
          <CommandItem onSelect={() => runCommand("/integrations")}>
            <Plug className="mr-2 h-4 w-4" />
            Integrations
          </CommandItem>
          <CommandItem onSelect={() => runCommand("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              console.log("New Project");
              setOpen(false);
            }}
          >
            <Search className="mr-2 h-4 w-4" />
            New Project
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
