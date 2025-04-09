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
};

export const NavLink = ({ to, icon: Icon, children }: NavLinkProps) => (
  <Link
    to={to}
    className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white overflow-hidden"
  >
    <Icon size={18} className="flex-shrink-0" />
    <span className="truncate">{children}</span>
  </Link>
);

export function AppNavigation() {
  return (
    <>
      <NavLink to="/" icon={Home}>
        Home
      </NavLink>
      <NavLink to="/slow-api" icon={Server}>
        Local Server API
      </NavLink>
      <NavLink to="/third-party-api" icon={Globe}>
        3rd Party API
      </NavLink>
      <NavLink to="/error" icon={AlertTriangle}>
        Upstream Error
      </NavLink>
      <NavLink to="/db-query" icon={Database}>
        DB Query
      </NavLink>
      <NavLink to="/batch-requests" icon={Layers}>
        Batch Requests
      </NavLink>
      <NavLink to="/nplus1" icon={AlertOctagon}>
        N+1 Query Problem
      </NavLink>
      <NavLink to="/client-component" icon={Users}>
        Client Component
      </NavLink>
    </>
  );
}
