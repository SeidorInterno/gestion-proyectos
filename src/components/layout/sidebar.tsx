"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Calendar,
  UserCog,
  FileBarChart,
  Settings,
  LogOut,
  Building2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

// Roles que pueden ver cada item del menu
type RoleCode = "MANAGER" | "ARQUITECTO_RPA" | "ANALISTA_FUNCIONAL" | "CONSULTOR";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"] as RoleCode[],
  },
  {
    title: "Clientes",
    href: "/dashboard/clientes",
    icon: Building2,
    allowedRoles: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"] as RoleCode[], // CONSULTOR no ve clientes
  },
  {
    title: "Proyectos",
    href: "/dashboard/proyectos",
    icon: FolderKanban,
    allowedRoles: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"] as RoleCode[],
  },
  {
    title: "Eventos",
    href: "/dashboard/eventos",
    icon: AlertCircle,
    allowedRoles: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"] as RoleCode[],
  },
  {
    title: "Recursos",
    href: "/dashboard/recursos",
    icon: Users,
    allowedRoles: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"] as RoleCode[],
  },
  {
    title: "Registro de Horas",
    href: "/dashboard/timetracking",
    icon: Clock,
    allowedRoles: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"] as RoleCode[],
  },
  {
    title: "Soporte",
    href: "/dashboard/soporte",
    icon: Headphones,
    allowedRoles: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"] as RoleCode[],
  },
  {
    title: "Calendario",
    href: "/dashboard/calendario",
    icon: Calendar,
    allowedRoles: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"] as RoleCode[],
  },
  {
    title: "Reportes",
    href: "/dashboard/reportes",
    icon: FileBarChart,
    allowedRoles: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"] as RoleCode[], // CONSULTOR no ve reportes
  },
];

const adminMenuItems = [
  {
    title: "Usuarios",
    href: "/dashboard/usuarios",
    icon: UserCog,
    allowedRoles: ["MANAGER"] as RoleCode[],
  },
  {
    title: "Configuracion",
    href: "/dashboard/configuracion",
    icon: Settings,
    allowedRoles: ["MANAGER"] as RoleCode[],
  },
];

interface SidebarProps {
  userRoleCode?: string;
}

export function Sidebar({ userRoleCode = "CONSULTOR" }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isManager = userRoleCode === "MANAGER";

  const NavLink = ({ item, isActive }: { item: typeof menuItems[0]; isActive: boolean }) => {
    const linkContent = (
      <motion.div
        whileHover={{ x: collapsed ? 0 : 4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            isActive
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          )}
        >
          <item.icon className="h-5 w-5 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap"
              >
                {item.title}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </motion.div>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <TooltipProvider>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex flex-col h-screen bg-slate-900 text-white"
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                  className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center font-bold shadow-lg shadow-blue-500/30"
                >
                  S
                </motion.div>
                <span className="font-semibold text-lg">Seidor RPA</span>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setCollapsed(!collapsed)}
            >
              <motion.div
                animate={{ rotate: collapsed ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronRight className="h-4 w-4" />
              </motion.div>
            </Button>
          </motion.div>
        </div>

        {/* Menu principal */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          <div className="px-3 space-y-1">
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >
                  Menu
                </motion.p>
              )}
            </AnimatePresence>
            {menuItems
              .filter((item) => item.allowedRoles.includes(userRoleCode as RoleCode))
              .map((item, index) => {
              // Dashboard solo debe estar activo si es exactamente /dashboard
              const isActive = item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <NavLink item={item} isActive={isActive} />
                </motion.div>
              );
            })}
          </div>

          {/* Menu de administrador (solo MANAGER) */}
          {isManager && (
            <div className="px-3 mt-6 space-y-1">
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                  >
                    Administracion
                  </motion.p>
                )}
              </AnimatePresence>
              {adminMenuItems.map((item, index) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (menuItems.length + index) * 0.05, duration: 0.3 }}
                  >
                    <NavLink item={item} isActive={isActive} />
                  </motion.div>
                );
              })}
            </div>
          )}
        </nav>

        {/* Cerrar sesion */}
        <div className="p-3 border-t border-slate-700">
          <motion.div whileHover={{ x: collapsed ? 0 : 4 }} whileTap={{ scale: 0.98 }}>
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-slate-300 hover:bg-red-600/20 hover:text-red-400 justify-center"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  Cerrar Sesion
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-slate-300 hover:bg-red-600/20 hover:text-red-400 justify-start"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-5 w-5" />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-3"
                >
                  Cerrar Sesion
                </motion.span>
              </Button>
            )}
          </motion.div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
