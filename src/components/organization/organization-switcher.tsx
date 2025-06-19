"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  ChevronDown,
  Plus,
  Check,
  Users,
  Crown,
  Shield
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  ticketPrefix: string;
  userRole: "ADMIN" | "MEMBER";
  _count: {
    members: number;
  };
  owner: {
    id: string;
    name: string;
  };
}

interface OrganizationSwitcherProps {
  currentOrganizationId?: string;
  onOrganizationChange?: (organizationId: string) => void;
}

export default function OrganizationSwitcher({
  currentOrganizationId,
  onOrganizationChange,
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Get the effective organization ID (from props or URL)
  const [effectiveOrgId, setEffectiveOrgId] = useState<string | null>(null);

  // Update effective org ID when props or URL changes
  useEffect(() => {
    const urlOrgId = pathname === "/dashboard" ? searchParams.get("org") : null;
    const newEffectiveOrgId = currentOrganizationId || urlOrgId;
    setEffectiveOrgId(newEffectiveOrgId);
  }, [currentOrganizationId, pathname, searchParams]);

  // Update current organization when organizations or effectiveOrgId changes
  useEffect(() => {
    if (organizations.length > 0 && effectiveOrgId) {
      const foundOrg = organizations.find(org => org.id === effectiveOrgId);
      setCurrentOrg(foundOrg || null);
    } else {
      setCurrentOrg(null);
    }
  }, [organizations, effectiveOrgId]);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Auto-select first organization if none is currently selected and organizations are available
  useEffect(() => {
    if (organizations.length > 0 && !effectiveOrgId && !onOrganizationChange) {
      const firstOrg = organizations[0];
      router.push(`/dashboard?org=${firstOrg.id}`);
    }
  }, [organizations, effectiveOrgId, onOrganizationChange, router]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations");
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };

  const handleOrganizationSelect = (organizationId: string) => {
    setIsOpen(false);
    if (onOrganizationChange) {
      onOrganizationChange(organizationId);
    } else {
      // Redirect to dashboard with organization context instead of team page
      router.push(`/dashboard?org=${organizationId}`);
    }
  };

  const handleCreateOrganization = () => {
    setIsOpen(false);
    router.push("/organizations/new");
  };

  if (loading) {
    return (
      <div className="w-64">
        <div className="h-10 bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between text-left"
        style={{
          backgroundColor: '#1d1d20',
          borderColor: '#2c2c34',
          color: '#b6c2cf'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#22222a'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1d1d20'; }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#579dff' }}>
            <Building2 className="h-3 w-3 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            {currentOrg ? (
              <div>
                <div className="font-medium truncate" style={{ color: '#b6c2cf' }}>{currentOrg.name}</div>
                <div className="text-xs" style={{ color: '#8993a4' }}>{currentOrg.ticketPrefix}</div>
              </div>
            ) : loading || !initialLoadComplete ? (
              <div className="font-medium" style={{ color: '#b6c2cf' }}>Loading...</div>
            ) : effectiveOrgId && organizations.length > 0 && !currentOrg ? (
              <div className="font-medium" style={{ color: '#b6c2cf' }}>Organization not found</div>
            ) : organizations.length === 0 ? (
              <div className="font-medium" style={{ color: '#b6c2cf' }}>No organizations</div>
            ) : (
              <div className="font-medium" style={{ color: '#b6c2cf' }}>Select Organization</div>
            )}
          </div>
        </div>
        <ChevronDown className="h-4 w-4" style={{ color: '#8993a4' }} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl" style={{ backgroundColor: '#161618', borderColor: '#2c2c34' }}>
            <CardContent className="p-2">
              <div className="space-y-1">
                {organizations.length > 0 ? (
                  <>
                    <div className="px-3 py-2">
                      <h4 className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6b778c' }}>
                        Your Organizations
                      </h4>
                    </div>

                    {organizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => handleOrganizationSelect(org.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left"
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#22222a'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#579dff' }}>
                            <Building2 className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium truncate" style={{ color: '#b6c2cf' }}>{org.name}</span>
                              {org.userRole === "ADMIN" && (
                                <Shield className="h-3 w-3" style={{ color: '#579dff' }} />
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-xs" style={{ color: '#8993a4' }}>
                              <span>{org.ticketPrefix}</span>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{org._count.members}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {effectiveOrgId === org.id && (
                          <Check className="h-4 w-4" style={{ color: '#579dff' }} />
                        )}
                      </button>
                    ))}

                    <div className="my-2" style={{ borderTop: '1px solid #2c2c34' }}></div>
                  </>
                ) : (
                  <div className="px-3 py-6 text-center">
                    <Building2 className="h-8 w-8 mx-auto mb-2" style={{ color: '#6b778c' }} />
                    <p className="text-sm mb-3" style={{ color: '#8993a4' }}>No organizations yet</p>
                  </div>
                )}

                <button
                  onClick={handleCreateOrganization}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left"
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#22222a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2c2c34' }}>
                    <Plus className="h-4 w-4" style={{ color: '#8993a4' }} />
                  </div>
                  <span className="font-medium" style={{ color: '#b6c2cf' }}>Create Organization</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
