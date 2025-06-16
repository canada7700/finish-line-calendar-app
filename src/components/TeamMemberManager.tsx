
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit2, Users } from 'lucide-react';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { TeamMember } from '../types/project';

const SKILL_COLORS = {
  millwork: {
    base: 'bg-purple-500 text-white hover:bg-purple-500/90 border-transparent',
    switch: 'data-[state=checked]:bg-purple-500',
  },
  boxes: {
    base: 'bg-blue-500 text-white hover:bg-blue-500/90 border-transparent',
    switch: 'data-[state=checked]:bg-blue-500',
  },
  stain: {
    base: 'bg-amber-500 text-white hover:bg-amber-500/90 border-transparent',
    switch: 'data-[state=checked]:bg-amber-500',
  },
  install: {
    base: 'bg-green-500 text-white hover:bg-green-500/90 border-transparent',
    switch: 'data-[state=checked]:bg-green-500',
  },
};

const TeamMemberManager = () => {
  const { teamMembers, addTeamMember, updateTeamMember, deleteTeamMember, isAddingTeamMember, isUpdatingTeamMember, isDeletingTeamMember } = useTeamMembers();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    weeklyHours: 40,
    hourlyRate: 0,
    canDoMillwork: true,
    canDoBoxes: true,
    canDoStain: true,
    canDoInstall: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      weeklyHours: 40,
      hourlyRate: 0,
      canDoMillwork: true,
      canDoBoxes: true,
      canDoStain: true,
      canDoInstall: true
    });
    setShowAddForm(false);
    setEditingMember(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMember) {
      updateTeamMember({
        memberId: editingMember.id,
        memberData: {
          ...formData,
          isActive: true
        }
      });
    } else {
      addTeamMember({
        ...formData,
        isActive: true
      });
    }
    
    resetForm();
  };

  const handleEdit = (member: TeamMember) => {
    setFormData({
      name: member.name,
      email: member.email || '',
      weeklyHours: member.weeklyHours,
      hourlyRate: member.hourlyRate || 0,
      canDoMillwork: member.canDoMillwork,
      canDoBoxes: member.canDoBoxes,
      canDoStain: member.canDoStain,
      canDoInstall: member.canDoInstall
    });
    setEditingMember(member);
    setShowAddForm(true);
  };

  const handleDelete = (memberId: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      deleteTeamMember(memberId);
    }
  };

  const getSkillBadges = (member: TeamMember) => {
    const skills: {name: string, className: string}[] = [];
    if (member.canDoMillwork) skills.push({ name: 'Millwork', className: SKILL_COLORS.millwork.base });
    if (member.canDoBoxes) skills.push({ name: 'Boxes', className: SKILL_COLORS.boxes.base });
    if (member.canDoStain) skills.push({ name: 'Stain', className: SKILL_COLORS.stain.base });
    if (member.canDoInstall) skills.push({ name: 'Install', className: SKILL_COLORS.install.base });
    return skills;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Management
            </CardTitle>
            <CardDescription>
              Manage team members and their work capacity for project assignments.
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Team member name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@company.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weeklyHours">Weekly Hours</Label>
                    <Input
                      id="weeklyHours"
                      type="number"
                      value={formData.weeklyHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, weeklyHours: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max="60"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Skills & Capabilities</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="canDoMillwork"
                        checked={formData.canDoMillwork}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canDoMillwork: checked }))}
                        className={SKILL_COLORS.millwork.switch}
                      />
                      <Label htmlFor="canDoMillwork">Millwork</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="canDoBoxes"
                        checked={formData.canDoBoxes}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canDoBoxes: checked }))}
                        className={SKILL_COLORS.boxes.switch}
                      />
                      <Label htmlFor="canDoBoxes">Box Construction</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="canDoStain"
                        checked={formData.canDoStain}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canDoStain: checked }))}
                        className={SKILL_COLORS.stain.switch}
                      />
                      <Label htmlFor="canDoStain">Staining</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="canDoInstall"
                        checked={formData.canDoInstall}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canDoInstall: checked }))}
                        className={SKILL_COLORS.install.switch}
                      />
                      <Label htmlFor="canDoInstall">Installation</Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isAddingTeamMember || isUpdatingTeamMember}>
                    {editingMember ? 'Update Member' : 'Add Member'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <h3 className="font-medium">Current Team Members</h3>
          {teamMembers.length > 0 ? (
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.weeklyHours} hours/week
                          {member.email && ` • ${member.email}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {getSkillBadges(member).map(skill => (
                          <Badge key={skill.name} variant="default" className={`text-xs ${skill.className}`}>
                            {skill.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(member)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(member.id)}
                      disabled={isDeletingTeamMember}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No team members found. Add your first team member to get started!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamMemberManager;
