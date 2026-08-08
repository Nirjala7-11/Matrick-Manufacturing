import {
  LayoutDashboard,
  Package,
  Cpu,
  Layers,
  Factory,
  CheckSquare,
  Boxes,
  TrendingUp,
  FileSpreadsheet,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { ROLES } from '../../config/roles';

/**
 * NavigationConfig
 * Centralized ERP Navigation definition categorized into operational sections.
 */
export const navigationSections = [
  {
    title: 'Core System',
    items: [
      {
        name: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR, ROLES.QUALITY_INSPECTOR],
        description: 'Plant high-level KPIs and operational metrics overview',
      },
    ],
  },
  {
    title: 'Master Data',
    items: [
      {
        name: 'Products',
        path: '/products',
        icon: Package,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR],
        description: 'Product master database & raw materials catalog',
      },
      {
        name: 'Work Centers',
        path: '/work-centers',
        icon: Cpu,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR],
        description: 'Shop floor machinery & capacity center management',
      },
      {
        name: 'Bill of Materials',
        path: '/boms',
        icon: Layers,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR],
        description: 'BOM structures, operations & component requirements',
      },
    ],
  },
  {
    title: 'Shop Floor Operations',
    items: [
      {
        name: 'Manufacturing Orders',
        path: '/manufacturing-orders',
        icon: Factory,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR, ROLES.QUALITY_INSPECTOR],
        badge: 'MO',
        description: 'Production plan scheduling and status tracking',
      },
      {
        name: 'Work Orders',
        path: '/work-orders',
        icon: CheckSquare,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR, ROLES.QUALITY_INSPECTOR],
        badge: 'WO',
        description: 'Shop floor task execution and operational logs',
      },
      {
        name: 'Inventory & Stock',
        path: '/inventory',
        icon: Boxes,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR, ROLES.QUALITY_INSPECTOR],
        description: 'Stock ledger, raw materials & finished goods movements',
      },
    ],
  },
  {
    title: 'Analytics & Compliance',
    items: [
      {
        name: 'Analytics',
        path: '/analytics',
        icon: TrendingUp,
        roles: [ROLES.ADMIN, ROLES.MANAGER],
        description: 'OEE, throughput analysis and capacity utilization',
      },
      {
        name: 'Reports',
        path: '/reports',
        icon: FileSpreadsheet,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.QUALITY_INSPECTOR],
        description: 'Production export logs and executive reports',
      },
    ],
  },
  {
    title: 'Enterprise Extras',
    items: [
      {
        name: 'Quality Management',
        path: '/quality',
        icon: ShieldCheck,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.QUALITY_INSPECTOR],
        description: 'Quality inspection logs and pass/fail checkpoints',
      },
      {
        name: 'Maintenance',
        path: '/maintenance',
        icon: Wrench,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR],
        description: 'Equipment maintenance tickets and downtime tracking',
      },
    ],
  },
];

/**
 * Helper to flatten all navigation items
 */
export const getAllNavItems = () => {
  return navigationSections.flatMap((section) => section.items);
};

export default navigationSections;
