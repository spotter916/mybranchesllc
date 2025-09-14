import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const eventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Event date is required"),
  endDate: z.string().optional(),
  location: z.string().optional(),
  groupId: z.string().min(1, "Please select a group"),
  status: z.string().default("planning"),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: any;
  onSave: () => void;
  onCancel: () => void;
}

export default function EventForm({ event, onSave, onCancel }: EventFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groups } = useQuery<Array<{ 
    id: string; 
    name: string; 
    description: string;
  }>>({
    queryKey: ['/api/groups'],
  });

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: event?.name || "",
      description: event?.description || "",
      date: event?.date ? new Date(event.date).toISOString().slice(0, 16) : "",
      endDate: event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
      location: event?.location || "",
      groupId: event?.groupId || "",
      status: event?.status || "planning",
    },
  });

  const saveEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      // Convert datetime-local input to proper ISO dates
      const eventData = {
        ...data,
        date: new Date(data.date).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      };

      if (event) {
        await apiRequest('PATCH', `/api/events/${event.id}`, eventData);
      } else {
        await apiRequest('POST', '/api/events', eventData);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: event ? "Event updated successfully" : "Event created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      onSave();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventFormData) => {
    saveEventMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Event Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Summer Family BBQ" 
                    {...field} 
                    data-testid="input-event-name" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="groupId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-event-group">
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {groups?.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-event-status">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date & Time</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field} 
                    data-testid="input-event-date" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date & Time (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field} 
                    data-testid="input-event-end-date" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Grandpa's House, Community Center" 
                  {...field} 
                  data-testid="input-event-location" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Event details, special instructions, etc..."
                  rows={4}
                  {...field}
                  data-testid="textarea-event-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            data-testid="button-cancel-event"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saveEventMutation.isPending}
            data-testid="button-save-event"
          >
            {event ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
