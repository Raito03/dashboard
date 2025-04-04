"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Box,
  ChevronDown,
  ChevronRight,
  Terminal,
} from "lucide-react";
import { useState } from "react";
import { IconBackpack, IconBallpenFilled, IconBooks, IconCalculator, IconFolder, IconPencil, IconSchool, IconSchoolBell, IconSettings } from "@tabler/icons-react";

interface NavItemProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  isNested?: boolean;
  hasChildren?: boolean;
  isOpen?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const isActive1 = (href: string, pathname: string) => {
    // Special case for root dashboard
    if (href === "/") {
      return pathname === "/";
    }
    
    // For regular links
    if (href !== "" && href !== "#") {
      return pathname === href || pathname.startsWith(href + "/");
    }
    
    return false;
  };
const NavItem = ({
    href,
    label,
    icon,
    badge,
    isNested,
    hasChildren,
    isOpen,
    onClick,
    children,
  }: NavItemProps) => {
    const pathname = usePathname();
    const isActive = href !== "#" && isActive1(href, pathname);
    
    // For parent items with dropdowns
    const hasActiveChild = hasChildren && pathname.includes(label.toLowerCase());
    
    const handleClick = (e: React.MouseEvent) => {
        if (hasChildren && href === "#") {
          e.preventDefault();
        }
        onClick?.();
      };
    return (
      <>
        <Link
          href={href}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm transition-colors no-underline",
            isNested ? "pl-11" : "pl-3",
            (isActive || hasActiveChild)
              ? "bg-gray-800 text-white font-medium" // Dark gray background when active
              : "text-gray-300 hover:bg-gray-800/50 hover:text-white",
          )}
          onClick={handleClick}
        >
          {icon}
          <span className="flex-grow">{label}</span>
          {badge && (
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500">
              {badge}
            </span>
          )}
          {hasChildren && (
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                isOpen && "transform rotate-180"
              )}
            />
          )}
        </Link>
        {children}
      </>
    );
  };
export function Sidebar() {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    students: false,
    teachers: false,
    mentors: false,
    schools: false,
    resources: false,
    resources_teachers: false,
    settings: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="w-60 h-screen bg-black text-white fixed left-0 top-0 border-r overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <Terminal className="h-6 w-6" />
          <span className="text-xl font-semibold">LifeApp</span>
        </div>
      </div>

      <nav className="space-y-0.5">
        <NavItem href="/" label="Dashboard" icon={<Home className="h-3 w-3" />} />
        
        <NavItem
          href="#"
          label="Students"
          icon={<IconBackpack className="h-3 w-3" />}
          hasChildren
          isOpen={openSections.students}
          onClick={() => toggleSection("students")
          }
        />
        {openSections.students && (
          <div className="space-y-0.5 ml-5">
            <NavItem href="/students/dashboard" label="Dashboard" isNested />
            <NavItem href="/students/mission" label="Mission" isNested />
            <NavItem href="/students/coupons_redeemed" label="Coupon Redeemed" isNested />
            <NavItem href="/students/quiz" label="Quiz" isNested />
            
            {/* <NavItem
              href="/interface/authentication"
              label="Authentication"
              isNested
              hasChildren
              isOpen={openSections.authentication}
              onClick={() => toggleSection("authentication")}
            />
            {openSections.authentication && (
              <div className="pl-4 space-y-0.5">
                <NavItem href="/auth/sign-in" label="Sign in" isNested />
                <NavItem href="/auth/sign-in-link" label="Sign in link" isNested />
                <NavItem
                  href="/auth/sign-in-illustration"
                  label="Sign in with illustration"
                  isNested
                />
                <NavItem
                  href="/auth/sign-in-cover"
                  label="Sign in with cover"
                  isNested
                />
                <NavItem href="/auth/sign-up" label="Sign up" isNested />
                <NavItem
                  href="/auth/forgot-password"
                  label="Forgot password"
                  isNested
                />
                <NavItem
                  href="/auth/terms"
                  label="Terms of service"
                  isNested
                />
                <NavItem href="/auth/lock" label="Lock screen" isNested />
                <NavItem
                  href="/auth/2fa"
                  label="2 step verification"
                  isNested
                />
                <NavItem
                  href="/auth/2fa-code"
                  label="2 step verification code"
                  isNested
                />
              </div>
            )} */}
            
            {/* <NavItem
              href="/interface/badges"
              label="Badges"
              isNested
              badge="NEW"
            />
            <NavItem href="/interface/blank" label="Blank page" isNested />
            <NavItem href="/interface/buttons" label="Buttons" isNested />
            <NavItem
              href="/interface/cards"
              label="Cards"
              isNested
              badge="NEW"
              hasChildren
              isOpen={openSections.cards}
              onClick={() => toggleSection("cards")}
            />
            <NavItem
              href="/interface/carousel"
              label="Carousel"
              isNested
              badge="NEW"
            />*/}
          </div> 
        )}

        <NavItem
            href="#"
            label="Teachers"
            icon = {<IconSchool className="h-3 w-3"/>}
            hasChildren
            isOpen={openSections.teachers}
            onClick={() => toggleSection("teachers")}
        />
        {openSections.teachers && (
            <div className="space-y-0.5 ml-5">
                <NavItem href="/teachers/dashboard" label="Dashboard" isNested />
            </div>
        )}


        <NavItem
            href="#"
            label="Mentors"
            icon = {<IconBallpenFilled className="h-3 w-3"/>}
            hasChildren
            isOpen={openSections.mentors}
            onClick={() => toggleSection("mentors")}
        />
        {openSections.mentors && (
            <div className="space-y-0.5 ml-5">
                <NavItem href="/mentors/dashboard" label="Dashboard" isNested />
                <NavItem href="/mentors/sessions" label="Sessions" isNested />
            </div>
        )}

        <NavItem
            href="#"
            label="Schools"
            icon = {<IconBooks className="h-3 w-3"/>}
            hasChildren
            isOpen={openSections.schools}
            onClick={() => toggleSection("schools")}
        />
        {openSections.schools && (
            <div className="space-y-0.5 ml-5">
                <NavItem href="/schools/dashboard" label="Dashboard" isNested />
                <NavItem href="/schools/school-data" label="School Data" isNested />
            </div>
        )}

        <NavItem
            href="#"
            label="Resources"
            icon = {<IconFolder className="h-3 w-3"/>}
            hasChildren
            isOpen={openSections.resources}
            onClick={() => toggleSection("resources")}
        />
        {openSections.resources && (
            <div className="space-y-0.5 ml-5">
                <NavItem href="#" label="Student/Related" isNested />
                <NavItem href="#" label="Teachers" isNested
                    hasChildren
                    isOpen={openSections.resources_teachers}
                    onClick={() => toggleSection("resources_teachers")} 
                />
                {openSections.resources_teachers && (
                    <div className="pl-4 space-y-0.5">
                    <NavItem href="/teachers/competencies" label="Competencies" isNested />
                    <NavItem href="/teachers/concept-cartoon-header" label="Concept Cartoon header" isNested />
                    <NavItem href="/teachers/concept-cartoons" label="Concept Cartoon" isNested />
                    <NavItem href="/teachers/assessment" label="Assessment" isNested />
                    <NavItem href="/teachers/worksheets" label="Work Sheets" isNested />
                    <NavItem href="/teachers/lesson-plan-language" label="Lesson Plan Language" isNested />
                    <NavItem href="/teachers/lesson-plans" label="Lesson Plans" isNested />
                    </div>
                )}
            </div>
        )}

        <NavItem href="#" label="Settings" isNested hasChildren icon = {<IconSettings className="h-3 w-3"/>}
        isOpen={openSections.settings}
        onClick={() => toggleSection("settings")}
        />
        {openSections.settings && (
            <div className="space-y-0.5 ml-5">
                <NavItem href="/settings/subjects" label="Subjects" isNested />
                <NavItem href="/settings/levels" label="Levels" isNested />
                <NavItem href="/settings/languages" label="Languages" isNested />
                <NavItem href="/settings/sections" label="Sections" isNested />
            </div>
        )}


        <NavItem href="#" label="Campaigns" isNested icon = {<IconCalculator className="h-3 w-3"/>} />


      </nav>
    </div>
  );
}