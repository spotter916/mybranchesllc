import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, MapPin, Edit, Plus } from "lucide-react";
import { format } from "date-fns";
import TaskItem from "./TaskItem";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EventCardProps {
  event: {
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
  };
  onEdit: (event: any) => void;
  'data-testid'?: string;
}

export default function EventCard({ event, onEdit, 'data-testid': testId }: EventCardProps) {
  const [newTaskName, setNewTaskName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks } = useQuery<Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
    assignedTo?: string;
    assignedToName?: string;
    createdBy: string;
    eventId: string;
  }>>({
    queryKey: ['/api/events', event.id, 'tasks'],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      await apiRequest('POST', '/api/tasks', taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id, 'tasks'] });
      setNewTaskName("");
      toast({
        title: "Success",
        description: "Task added successfully",
      });
    },
  });

  const handleAddTask = () => {
    if (newTaskName.trim()) {
      createTaskMutation.mutate({
        name: newTaskName.trim(),
        eventId: event.id,
        status: 'pending',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const completedTasks = tasks?.filter(task => task.status === 'completed').length || 0;
  const totalTasks = tasks?.length || 0;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className="overflow-hidden" data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-xl font-semibold text-foreground" data-testid="text-event-name">
                {event.name}
              </h3>
              <Badge className={getStatusColor(event.status)} data-testid="badge-event-status">
                {event.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mb-3" data-testid="text-event-description">
              {event.description}
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center" data-testid="event-date">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
              </div>
              {event.endDate && (
                <div className="flex items-center" data-testid="event-time">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>
                    {format(new Date(event.date), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
                  </span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center" data-testid="event-location">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {event.groupName && (
              <Badge variant="outline" data-testid="badge-event-group">
                {event.groupName}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => onEdit(event)} data-testid="button-edit-event">
              <Edit className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Event Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Event Progress</span>
            <span className="text-sm text-muted-foreground" data-testid="text-event-progress">
              {completedTasks} of {totalTasks} tasks completed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" data-testid="progress-event" />
        </div>

        {/* Task List */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Tasks & Assignments</h4>
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskItem key={task.id} task={task} data-testid={`task-${task.id}`} />
            ))
          ) : (
            <p className="text-muted-foreground text-sm" data-testid="text-no-tasks">
              No tasks yet. Add some tasks to get started!
            </p>
          )}
        </div>

        {/* Add Task */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex space-x-2">
            <Input
              placeholder="Add a new task..."
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              data-testid="input-new-task"
            />
            <Button 
              onClick={handleAddTask}
              disabled={!newTaskName.trim() || createTaskMutation.isPending}
              data-testid="button-add-task"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
