"use client";

import { useTheme } from "next-themes";
import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientValue } from "@/lib/hooks/use-client-value";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // Avoid rendering theme-dependent UI before hydration to prevent a
  // light/dark mismatch flash between server and client.
  const mounted = useClientValue(() => true, false);

  if (!mounted) {
    return <Button variant="ghost" size="icon-sm" disabled aria-hidden />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
        {theme === "dark" ? (
          <MoonIcon />
        ) : theme === "light" ? (
          <SunIcon />
        ) : (
          <MonitorIcon />
        )}
        <span className="sr-only">Changer de thème</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <SunIcon /> Clair
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <MoonIcon /> Sombre
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <MonitorIcon /> Système
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
