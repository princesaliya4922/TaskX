"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ProjectLayout from "@/components/layout/project-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  UserPlus, 
  MoreVertical, 
  Crown, 
  User,
  Mail,
  Calendar,
  Trash2
} from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";

interface ProjectMember {
  id: string;
  role: "LEAD" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    isActive: boolean;
  };
}

interface OrganizationMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export default function ProjectTeamPage() {
  const params = useParams();
  const { data: session } = useSession();
  const organizationId = params.id as string;
  const projectId = params.projectId as string;

  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"LEAD" | "MEMBER">("MEMBER");
  const [adding, setAdding] = useState(false);

  // Check if current user is project lead
  const currentUserMember = projectMembers.find(m => m.user.id === session?.user?.id);
  const isProjectLead = currentUserMember?.role === "LEAD";

  useEffect(() => {
    fetchProjectMembers();
    fetchOrganizationMembers();
  }, []);

  const fetchProjectMembers = async () => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/projects/${projectId}/members`
      );
      if (response.ok) {
        const data = await response.json();
        setProjectMembers(data);
      }
    } catch (error) {
      console.error("Error fetching project members:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationMembers = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members`);
      if (response.ok) {
        const data = await response.json();
        setOrganizationMembers(data);
      }
    } catch (error) {
      console.error("Error fetching organization members:", error);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    setAdding(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/projects/${projectId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: selectedUserId,
            role: selectedRole,
          }),
        }
      );

      if (response.ok) {
        await fetchProjectMembers();
        setShowAddDialog(false);
        setSelectedUserId("");
        setSelectedRole("MEMBER");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add member");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the project?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/projects/${projectId}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await fetchProjectMembers();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member");
    }
  };

  // Get available users to add (org members not already in project)
  const availableUsers = organizationMembers.filter(
    orgMember => !projectMembers.some(projMember => projMember.user.id === orgMember.user.id)
  );

  if (loading) {
    return (
      <ProjectLayout>
        <div className="p-6">
          <div className="text-center">
            <div className="text-gray-400">Loading team members...</div>
          </div>
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Team Members</h1>
                <p className="text-gray-400">Manage project team members and their roles</p>
              </div>
            </div>
            
            {isProjectLead && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add Team Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">
                        Select Member
                      </label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue placeholder="Choose a member to add" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {availableUsers.map((member) => (
                            <SelectItem key={member.user.id} value={member.user.id}>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={member.user.avatarUrl || ""} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(member.user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{member.user.name}</div>
                                  <div className="text-xs text-gray-400">{member.user.email}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">
                        Role
                      </label>
                      <Select value={selectedRole} onValueChange={(value: "LEAD" | "MEMBER") => setSelectedRole(value)}>
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="LEAD">Lead</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button
                        onClick={handleAddMember}
                        disabled={!selectedUserId || adding}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {adding ? "Adding..." : "Add Member"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddDialog(false)}
                        className="border-gray-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Team Members List */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Team Members ({projectMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.user.avatarUrl || ""} />
                      <AvatarFallback>
                        {getInitials(member.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-white">{member.user.name}</h3>
                        {member.role === "LEAD" && (
                          <Badge variant="secondary" className="bg-yellow-600 text-yellow-100">
                            <Crown className="h-3 w-3 mr-1" />
                            Lead
                          </Badge>
                        )}
                        {member.role === "MEMBER" && (
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            <User className="h-3 w-3 mr-1" />
                            Member
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{member.user.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {formatDate(member.joinedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isProjectLead && member.user.id !== session?.user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-gray-800 border-gray-700">
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}

              {projectMembers.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No team members yet</p>
                  {isProjectLead && (
                    <p className="text-sm">Add members to start collaborating</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProjectLayout>
  );
}
