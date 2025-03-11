'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { SIDENAV_ITEMS } from '@/constants';
import { SideNavItem } from '@/types';

// MenuItem component for handling nested menu items
const MenuItem = ({ item }: { item: SideNavItem }) => {
    const pathname = usePathname();
    const [subMenuOpen, setSubMenuOpen] = useState(false);
    
    const toggleSubMenu = () => {
      setSubMenuOpen(!subMenuOpen);
    };
    
    return (
      <div className="w-full">
        {item.submenu ? (
          <>
            <button
              onClick={toggleSubMenu}
              className={`flex flex-row items-center rounded-lg hover:bg-zinc-100 w-full pl-4 py-3 justify-between !pr-0 ${
                pathname.includes(item.path) ? 'bg-zinc-100' : ''
              }`}
            >
              <div className="flex flex-row space-x-3 items-center text-base text-black">
                <span className="text-lg">{item.icon}</span>
                <span>{item.title}</span>
              </div>
              <Icon
                icon="lucide:chevron-down"
                width="16"
                height="16"
                className={`transition-transform duration-200 ${
                  subMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
  
            {subMenuOpen && (
              <div className="ml-8 flex flex-col space-y-1">
                {item.subMenuItems?.map((subItem, idx) => (
                  <Link
                    key={idx}
                    href={subItem.path}
                    className={`!no-underline font-normal text-sm text-gray-700 py-2 pl-4 hover:text-blue-600 ${
                      subItem.path === pathname ? 'font-semibold text-blue-600' : ''
                    }`}
                  >
                    {subItem.title}
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <Link
            href={item.path}
            className={`flex flex-row !no-underline text-black items-center space-x-3 pl-4 py-3 rounded-lg hover:bg-zinc-100 ${
              item.path === pathname ? 'bg-zinc-100' : ''
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.title}</span>
          </Link>
        )}
      </div>
    );
};
  

// Main Sidebar Component
export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="navbar navbar-vertical navbar-expand-lg navbar-light bg-white custom-sidebar fixed-left"
      style={{ width: '250px', zIndex: 1000 }}
    >
      <div className="container-fluid">
        <div className="navbar-nav pt-lg-3 d-flex flex-column g-3 overflow-x-hidden">
          {SIDENAV_ITEMS.map((item, idx) => (
            <MenuItem key={idx} item={item} />
          ))}
        </div>
      </div>
    </aside>
  );
}