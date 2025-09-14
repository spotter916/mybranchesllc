import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Home, MapPin, Users, Phone, Calendar, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface HouseholdMember {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
  phone?: string;
  birthday?: string;
  showBirthday?: boolean;
  showPhone?: boolean;
  role: string;
}

interface Household {
  id: string;
  name: string;
  ownerId: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  createdAt: string;
}

export default function HouseholdDetail() {
  const params = useParams();
  const householdId = params.id;

  const { data: household, isLoading: householdLoading } = useQuery<Household>({
    queryKey: [`/api/households/${householdId}`],
    enabled: !!householdId,
  });

  const { data: members, isLoading: membersLoading } = useQuery<HouseholdMember[]>({
    queryKey: [`/api/households/${householdId}/members`],
    enabled: !!householdId,
  });

  if (householdLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-foreground mb-2">Household not found</h3>
        <p className="text-muted-foreground mb-4">The household you're looking for doesn't exist or you don't have access to it.</p>
        <Link href="/groups">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </Button>
        </Link>
      </div>
    );
  }

  const address = [household.street, household.city, household.state, household.zipCode, household.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/groups">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="text-household-title">
            <Home className="h-8 w-8" />
            {household.name}
          </h1>
          <p className="text-muted-foreground mt-1">Household Information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Household Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="text-household-info-title">
              <MapPin className="h-5 w-5" />
              Household Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-foreground">Name</p>
              <p className="text-muted-foreground" data-testid="text-household-name">{household.name}</p>
            </div>
            
            {address && (
              <div>
                <p className="font-medium text-foreground">Address</p>
                <p className="text-muted-foreground" data-testid="text-household-address">{address}</p>
              </div>
            )}

            <div>
              <p className="font-medium text-foreground">Members</p>
              <p className="text-muted-foreground">{members?.length || 0} member{members?.length !== 1 ? 's' : ''}</p>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="text-members-title">
              <Users className="h-5 w-5" />
              Household Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members && members.length > 0 ? (
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="p-3 bg-muted rounded-lg" data-testid={`member-${member.id}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={member.profileImageUrl || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}`}
                        alt={`${member.firstName} ${member.lastName}`}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground">
                            {member.firstName} {member.lastName}
                          </p>
                          <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="text-xs">
                            {member.role === 'owner' ? 'Head of Household' : 'Member'}
                          </Badge>
                        </div>
                        
                        {/* Contact Information */}
                        <div className="space-y-1 text-sm">
                          {member.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{member.email}</span>
                            </div>
                          )}
                          
                          {member.phone && member.showPhone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          
                          {member.birthday && member.showBirthday && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(member.birthday).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No members found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}