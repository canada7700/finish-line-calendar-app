
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Users } from 'lucide-react';

const Settings = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your cabinet finishing scheduler preferences and configuration.
          </p>
        </div>

        <Separator />

        <div className="grid gap-6">
          {/* Holidays Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Holidays & Non-Working Days
              </CardTitle>
              <CardDescription>
                Configure holidays and non-working days that will be excluded from project scheduling.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="holiday-name">Holiday Name</Label>
                  <Input id="holiday-name" placeholder="e.g., Christmas Day" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holiday-date">Date</Label>
                  <Input id="holiday-date" type="date" />
                </div>
              </div>
              <Button>Add Holiday</Button>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Currently configured holidays:</p>
                <ul className="space-y-1">
                  <li>• New Year's Day - January 1st</li>
                  <li>• Christmas Day - December 25th</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Working Hours Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Working Hours
              </CardTitle>
              <CardDescription>
                Set your standard working hours per day for accurate project scheduling.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shop-hours">Shop Hours per Day</Label>
                  <Input id="shop-hours" type="number" defaultValue="8" min="1" max="12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stain-hours">Staining Hours per Day</Label>
                  <Input id="stain-hours" type="number" defaultValue="6" min="1" max="12" />
                </div>
              </div>
              <Button>Save Working Hours</Button>
            </CardContent>
          </Card>

          {/* Team Management Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                Manage team members and their access to the cabinet finishing scheduler.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-member-email">Add Team Member</Label>
                <div className="flex gap-2">
                  <Input id="team-member-email" type="email" placeholder="team@example.com" className="flex-1" />
                  <Button>Invite</Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Current team members:</p>
                <ul className="space-y-1">
                  <li>• admin@company.com (Owner)</li>
                  <li>• manager@company.com (Admin)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Password Section */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
