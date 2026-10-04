"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Dumbbell,
  Heart,
  Home,
  Moon,
  Sunrise,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Plan Today and Weekly Planning are deliberately absent: they are flows
 * reached from Home's two buttons, not tabs (PRD §4.1).
 */
const MAIN: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/people", label: "People", icon: Users },
  { href: "/dates", label: "Dates", icon: Heart },
  { href: "/scripture", label: "Scripture", icon: BookOpen },
  { href: "/gym", label: "Gym", icon: Dumbbell },
];

const RHYTHM: NavItem[] = [
  { href: "/morning", label: "Morning Review", icon: Sunrise },
  { href: "/nightly", label: "Nightly Review", icon: Moon },
];

export function AppSidebar({ morningDone }: { morningDone: boolean }) {
  const pathname = usePathname();
  // The Morning Review tab is time-based: it appears each morning, hides once
  // marked done, and returns tomorrow (PRD §4.8).
  const rhythm = morningDone
    ? RHYTHM.filter((item) => item.href !== "/morning")
    : RHYTHM;
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const renderItems = (items: NavItem[]) =>
    items.map(({ href, label, icon: Icon }) => (
      <SidebarMenuItem key={href}>
        {/* Base UI composes via `render`, not Radix's `asChild`. */}
        <SidebarMenuButton
          render={<Link href={href} />}
          isActive={isActive(href)}
          tooltip={label}
        >
          <Icon strokeWidth={1.8} />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-1 py-1.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-primary font-semibold text-sidebar-primary-foreground">
            C
          </div>
          <div className="grid group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-accent-foreground">
              Companion
            </span>
            <span className="text-[11px] text-sidebar-foreground">
              Goal · Plan · Act · Account
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(MAIN)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Daily rhythm</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(rhythm)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2.5 px-1 py-1">
          <Avatar className="size-8">
            <AvatarFallback className="bg-sidebar-accent text-[11px] text-sidebar-accent-foreground">
              CK
            </AvatarFallback>
          </Avatar>
          <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm text-sidebar-accent-foreground">
              Carter
            </span>
            <span className="text-[11px] text-sidebar-foreground">
              Synced with Google
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
