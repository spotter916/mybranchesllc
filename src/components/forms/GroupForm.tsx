import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const groupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  details: z.string().optional(),
});

type GroupFormData = z.infer<typeof groupSchema>;

interface GroupFormProps {
  group?: {
    id: string;
    name: string;
    description?: string;
    details?: string;
  };
  onSave: () => void;
  onCancel: () => void;
}

export default function GroupForm({ group, onSave, onCancel }: GroupFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: group?.name || "",
      description: group?.description || "",
      details: group?.details || "",
    },
  });

  const saveGroupMutation = useMutation({
    mutationFn: async (data: GroupFormData) => {
      if (group) {
        await apiRequest('PATCH', `/api/groups/${group.id}`, data);
      } else {
        await apiRequest('POST', '/api/groups', data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: group ? "Group updated successfully" : "Group created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      onSave();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save group",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GroupFormData) => {
    saveGroupMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Smith Extended Family" 
                  {...field} 
                  data-testid="input-group-name" 
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
                  placeholder="Brief description of the group..."
                  rows={3}
                  {...field}
                  data-testid="textarea-group-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Details</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional details to help people find and join your group..."
                  rows={3}
                  {...field}
                  data-testid="textarea-group-details"
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
            data-testid="button-cancel-group"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saveGroupMutation.isPending}
            data-testid="button-save-group"
          >
            {group ? "Update Group" : "Create Group"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
