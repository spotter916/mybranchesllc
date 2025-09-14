import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import EventCard from "@/components/EventCard";
import EventForm from "@/components/forms/EventForm";
import { useAuth } from "@/hooks/useAuth";
import { canUserAccessFeature } from "@shared/subscription-utils";
import { useHouseholdSubscription } from '@/hooks/useHouseholdSubscription';
import UpgradePrompt from "@/components/UpgradePrompt";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Events() {
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [filter, setFilter] = useState("all");
  const { user } = useAuth() as {
    user?: {
      subscriptionPlan?: string;
    };
  };
  const { hasPremium, canAccessFeature } = useHouseholdSubscription();

  const { data: events, isLoading } = useQuery<Array<{
    id: string;
    name: string;
    description: string;
    date: string;
    endDate?: string;
    location: string;
    status: string;
    groupName?: string;
    taskCount?: number;
    completedTasks?: number;
  }>>({
    queryKey: ['/api/events'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredEvents = events?.filter(event => {
    if (filter === "all") return true;
    if (filter === "upcoming") return new Date(event.date) > new Date();
    if (filter === "in_progress") return event.status === "planning" || event.status === "confirmed";
    if (filter === "completed") return event.status === "completed";
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground" data-testid="text-events-title">
          Family Events
        </h1>
        <Button 
          onClick={() => {
            const hasEventPlanning = canAccessFeature('hasEventPlanning');
            if (hasEventPlanning) {
              setShowEventForm(true);
            }
          }}
          data-testid="button-create-event"
          disabled={!canAccessFeature('hasEventPlanning')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Event Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {[
          { key: "all", label: "All Events" },
          { key: "upcoming", label: "Upcoming" },
          { key: "in_progress", label: "In Progress" },
          { key: "completed", label: "Completed" },
        ].map((filterOption) => (
          <Button
            key={filterOption.key}
            variant={filter === filterOption.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(filterOption.key)}
            className="whitespace-nowrap"
            data-testid={`button-filter-${filterOption.key}`}
          >
            {filterOption.label}
          </Button>
        ))}
      </div>

      {/* Events List or Upgrade Prompt */}
      {(() => {
        const hasEventPlanning = canAccessFeature('hasEventPlanning');
        
        if (!hasEventPlanning) {
          return (
            <UpgradePrompt
              feature="Advanced Event Planning"
              description="Plan events with shared to-do lists, task assignments, and collaborative planning tools to make every gathering perfect."
            />
          );
        }

        return filteredEvents.length > 0 ? (
          <div className="space-y-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={(event) => {
                  setEditingEvent(event);
                  setShowEventForm(true);
                }}
                data-testid={`event-card-${event.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-events-title">
                No events found
              </h3>
              <p className="text-muted-foreground mb-4" data-testid="text-no-events-description">
                {filter === "all" 
                  ? "Create your first family event to start planning together"
                  : `No ${filter.replace('_', ' ')} events found`
                }
              </p>
            </div>
          </div>
        );
      })()}

      {/* Create/Edit Event Dialog */}
      <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-event-form-title">
              {editingEvent ? "Edit Event" : "Create New Event"}
            </DialogTitle>
          </DialogHeader>
          <EventForm
            event={editingEvent}
            onSave={() => {
              setShowEventForm(false);
              setEditingEvent(null);
            }}
            onCancel={() => {
              setShowEventForm(false);
              setEditingEvent(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
