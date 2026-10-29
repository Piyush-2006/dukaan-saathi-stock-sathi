import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChartColumn,
  LayoutDashboard,
  Mic,
  NotebookText,
  Package,
  Settings,
  ShoppingCart,
  Store,
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

const NAV_ITEMS = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Products & Stock", url: "/products", icon: Package },
  { title: "Sales", url: "/sales", icon: ShoppingCart },
  { title: "Customer Udhaar", url: "/udhaar", icon: NotebookText },
  { title: "AI Voice Assistant", url: "/voice", icon: Mic },
  { title: "Reports", url: "/reports", icon: ChartColumn },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="pointer-events-none">
              <Link to="/">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Store className="size-5" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="font-display text-base font-bold">DukaanSaathi</span>
                  <span className="text-[11px] text-sidebar-foreground/70">
                    Your digital shop partner
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Shop</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active =
                  item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 pb-1 text-[11px] text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
          v1.0.0 · Demo build
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
