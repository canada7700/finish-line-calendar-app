
import TeamWorkloadOverview from '../components/TeamWorkloadOverview';

const Team = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground">
            Team management has been replaced with capacity-based scheduling. 
            Configure daily phase capacities in the Settings page.
          </p>
        </div>
        
        <TeamWorkloadOverview />
      </div>
    </div>
  );
};

export default Team;
