"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Users, 
  Settings, 
  UserPlus, 
  Building2, 
  BarChart3, 
  Calendar,
  CheckCircle,
  Crown,
  Shield,
  User,
  MoreVertical,
  Mail
} from "lucide-react";
import Link from "next/link";
import InviteMemberModal from "@/components/organization/invite-member-modal";
import { usePermissions, PermissionGate } from "@/hooks/use-permissions";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ticketPrefix: string;
  logoUrl?: string;
  userRole: "ADMIN" | "MEMBER";
  owner: {
    id: string;
    name: string;
    email: string;
  };
  members: Array<{
    id: string;
    role: "ADMIN" | "MEMBER";
    joinedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  }>;
  _count: {
    members: number;
    tickets: number;
    sprints: number;
    labels: number;
  };
}

export default function OrganizationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);

  const organizationId = params.id as string;

  // Always call hooks at the top level - pass null when organization is not loaded yet
  const { permissions, hasPermission, isAdmin, isOwner } = usePermissions(organization);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetchOrganization();
  }, [session, organizationId]);

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          setError("You don't have access to this organization");
        } else if (response.status === 404) {
          setError("Organization not found");
        } else {
          setError("Failed to load organization");
        }
        return;
      }

      const data = await response.json();
      setOrganization(data);
    } catch (error) {
      console.error("Error fetching organization:", error);
      setError("Failed to load organization");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-black">
        <header className="border-b border-gray-800 bg-black">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center h-16">
              <Link href="/dashboard" className="flex items-center text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button onClick={() => router.push("/dashboard")} className="bg-blue-600 hover:bg-blue-700">
              Return to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="p-6">{/* Main Content - header is now handled by AppLayout */}
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{organization.name}</h1>
              <p className="text-gray-400">{organization.ticketPrefix} • {organization._count.members} members</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <PermissionGate organization={organization} permission="canInviteMembers">
              <Button
                size="sm"
                onClick={() => setShowInviteModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </PermissionGate>
            <PermissionGate organization={organization} permission="canManageOrganization">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <Settings className="h-4 w-4" />
              </Button>
            </PermissionGate>
          </div>
        </div>
        {organization.description && (
          <p className="text-gray-300 mt-4">{organization.description}</p>
        )}
      </div>


        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Members</p>
                <p className="text-white text-2xl font-semibold">{organization._count.members}</p>
              </div>
              <Users className="h-5 w-5 text-gray-500" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Tickets</p>
                <p className="text-white text-2xl font-semibold">{organization._count.tickets}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-gray-500" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Sprints</p>
                <p className="text-white text-2xl font-semibold">{organization._count.sprints}</p>
              </div>
              <Calendar className="h-5 w-5 text-gray-500" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Labels</p>
                <p className="text-white text-2xl font-semibold">{organization._count.labels}</p>
              </div>
              <BarChart3 className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Members Section */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Team Members</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your organization members and their roles
                </CardDescription>
              </div>
              <PermissionGate organization={organization} permission="canInviteMembers">
                <Button
                  size="sm"
                  onClick={() => setShowInviteModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </PermissionGate>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organization.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-300" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-white font-medium">{member.user.name}</h4>
                        {member.role === "ADMIN" && (
                          <Shield className="h-4 w-4 text-blue-400" />
                        )}
                        {isOwner && member.user.id === organization.owner.id && (
                          <Crown className="h-4 w-4 text-yellow-400" />
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-400">
                      {member.role === "ADMIN" ? "Admin" : "Member"}
                    </span>
                    <PermissionGate
                      organization={organization}
                      permission="canChangeRoles"
                      fallback={
                        member.user.id === session?.user?.id ? (
                          <PermissionGate organization={organization} permission="canRemoveMembers">
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                        ) : null
                      }
                    >
                      {member.user.id !== session?.user?.id && (
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      )}
                    </PermissionGate>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      {/* Invite Member Modal */}
      <InviteMemberModal
        organizationId={organizationId}
        organizationName={organization.name}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          fetchOrganization(); // Refresh organization data
          setShowInviteModal(false);
        }}
      />
    </div>
  );
}
