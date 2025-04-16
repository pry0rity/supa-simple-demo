import { Link } from "react-router-dom";
import {
  AlertTriangle,
  AlertOctagon,
  Database,
  Layers,
  Server,
  Users,
  Home,
  Globe,
} from "./Icons";

type NavLinkProps = {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isCollapsed?: boolean;
};

export const NavLink = ({
  to,
  icon: Icon,
  children,
  isCollapsed,
}: NavLinkProps) => (
  <Link
    to={to}
    className={`flex items-center p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white overflow-hidden transition-all duration-200 ${
      isCollapsed ? "justify-center" : "space-x-3"
    }`}
    title={isCollapsed ? String(children) : undefined}
  >
    <Icon size={20} className="flex-shrink-0" />
    {!isCollapsed && (
      <span className="truncate transition-opacity duration-200">
        {children}
      </span>
    )}
  </Link>
);

type AppNavigationProps = {
  isCollapsed?: boolean;
};

export function AppNavigation({ isCollapsed }: AppNavigationProps) {
  return (
    <>
      <NavLink to="/" icon={Home} isCollapsed={isCollapsed}>
        Home
      </NavLink>
      <NavLink to="/slow-api" icon={Server} isCollapsed={isCollapsed}>
        Local Server API
      </NavLink>
      <NavLink to="/third-party-api" icon={Globe} isCollapsed={isCollapsed}>
        3rd Party API
      </NavLink>
      <NavLink to="/error" icon={AlertTriangle} isCollapsed={isCollapsed}>
        Upstream Error
      </NavLink>
      <NavLink to="/db-query" icon={Database} isCollapsed={isCollapsed}>
        DB Query
      </NavLink>
      <NavLink to="/batch-requests" icon={Layers} isCollapsed={isCollapsed}>
        Batch Requests
      </NavLink>
      <NavLink to="/nplus1" icon={AlertOctagon} isCollapsed={isCollapsed}>
        N+1 Query Problem
      </NavLink>
      <NavLink to="/nplus1-debug" icon={AlertOctagon} isCollapsed={isCollapsed}>
        N+1 Query Debug
      </NavLink>
      <NavLink to="/client-component" icon={Users} isCollapsed={isCollapsed}>
        Client Component
      </NavLink>
    </>
  );
}
