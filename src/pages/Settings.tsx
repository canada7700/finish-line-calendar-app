
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Trash2, Plus } from 'lucide-react';
import { useHolidays } from '../hooks/useHolidays';
import { useSettings } from '../hooks/useSettings';
import { format } from 'date-fns';

const Settings = () => {
  const { holidays, addHoliday, deleteHoliday, isAddingHoliday, isDeletingHoliday } = useHolidays();
  const { getSetting, updateSetting, isUpdating } = useSettings();
  
  // Holiday form state
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  
  // Working hours state
  const [shopHours, setShopHours] = useState(getSetting('shop_hours_per_day', '8'));
  const [stainHours, setStainHours] = useState(getSetting('stain_hours_per_day', '6'));

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (holidayName.trim() && holidayDate) {
      // Ensure the date is stored exactly as entered without timezone conversion
      const dateValue = holidayDate; // Keep the YYYY-MM-DD format as is
      console.log('Adding holiday with date:', dateValue);
      addHoliday({ name: holidayName.trim(), date: dateValue });
      setHolidayName('');
      setHolidayDate('');
    }
  };

  const handleUpdateWorkingHours = () => {
    updateSetting({ key: 'shop_hours_per_day', value: shopHours });
    updateSetting({ key: 'stain_hours_per_day', value: stainHours });
  };

  const formatHolidayDate = (dateString: string) => {
    try {
      // Create date object from YYYY-MM-DD string without timezone conversion
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return format(date, 'MMMM do, yyyy');
    } catch {
      return dateString;
    }
  };

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
              <form onSubmit={handleAddHoliday} className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="holiday-name">Holiday Name</Label>
                  <Input 
                    id="holiday-name" 
                    placeholder="e.g., Christmas Day"
                    value={holidayName}
                    onChange={(e) => setHolidayName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holiday-date">Date</Label>
                  <Input 
                    id="holiday-date" 
                    type="date"
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Button type="submit" disabled={isAddingHoliday} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {isAddingHoliday ? 'Adding Holiday...' : 'Add Holiday'}
                  </Button>
                </div>
              </form>
              
              <div className="space-y-2">
                <p className="font-medium text-sm">Currently configured holidays:</p>
                {holidays.length > 0 ? (
                  <div className="space-y-2">
                    {holidays.map((holiday) => (
                      <div key={holiday.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <span className="text-sm">
                          <strong>{holiday.name}</strong> - {formatHolidayDate(holiday.date)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHoliday(holiday.id)}
                          disabled={isDeletingHoliday}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No holidays configured yet.</p>
                )}
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
                  <Input 
                    id="shop-hours" 
                    type="number" 
                    value={shopHours}
                    onChange={(e) => setShopHours(e.target.value)}
                    min="1" 
                    max="12" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stain-hours">Staining Hours per Day</Label>
                  <Input 
                    id="stain-hours" 
                    type="number"
                    value={stainHours}
                    onChange={(e) => setStainHours(e.target.value)}
                    min="1" 
                    max="12" 
                  />
                </div>
              </div>
              <Button onClick={handleUpdateWorkingHours} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Working Hours'}
              </Button>
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
