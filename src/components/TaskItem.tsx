import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TaskItemProps {
  task: {
    id: string;
    name: string;
    description?: string;
    assignedTo?: string;
    assigneeName?: string;
    status: string;
    eventId: string;
  };
  'data-testid'?: string;
}

export default function TaskItem({ task, 'data-testid': testId }: TaskItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTaskStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest('PATCH', `/api/tasks/${task.id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', task.eventId, 'tasks'] });
      toast({
        title: "Success",
        description: "Task status updated successfully",
      });
    },
  });

  const assignTaskMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PATCH', `/api/tasks/${task.id}/assign`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', task.eventId, 'tasks'] });
      toast({
        title: "Success", 
        description: "Task assigned successfully",
      });
    },
  });

  const handleStatusChange = (checked: boolean) => {
    const newStatus = checked ? 'completed' : 'pending';
    updateTaskStatusMutation.mutate(newStatus);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid={testId}>
      <div className="flex items-center space-x-3">
        <Checkbox
          checked={task.status === 'completed'}
          onCheckedChange={handleStatusChange}
          disabled={updateTaskStatusMutation.isPending}
          data-testid="checkbox-task-status"
        />
        <div>
          <p className="font-medium text-foreground text-sm" data-testid="text-task-name">
            {task.name}
          </p>
          {task.assigneeName ? (
            <p className="text-xs text-muted-foreground" data-testid="text-task-assignee">
              Assigned to: {task.assigneeName}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground" data-testid="text-task-unassigned">
              Unassigned
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {getStatusBadge(task.status)}
        {!task.assignedTo && (
          <Button
            size="sm"
            onClick={() => assignTaskMutation.mutate()}
            disabled={assignTaskMutation.isPending}
            data-testid="button-assign-task"
          >
            Assign to Me
          </Button>
        )}
      </div>
    </div>
  );
}
