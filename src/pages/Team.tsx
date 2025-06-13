
import TeamMemberManager from '../components/TeamMemberManager';

const Team = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your team members and their work capacity for project assignments.
          </p>
        </div>

        <TeamMemberManager />
      </div>
    </div>
  );
};

export default Team;
