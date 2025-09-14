import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  birthday: z.string().optional(),
  showBirthday: z.boolean().default(true),
  showAddress: z.boolean().default(true),
  showPhone: z.boolean().default(true),
  notes: z.string().optional(),
  addToHousehold: z.boolean().default(false),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact?: any;
  onSave: () => void;
  onCancel: () => void;
}

export default function ContactForm({ contact, onSave, onCancel }: ContactFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: contact?.firstName || "",
      lastName: contact?.lastName || "",
      email: contact?.email || "",
      phone: contact?.phone || "",
      street: contact?.street || "",
      city: contact?.city || "",
      state: contact?.state || "",
      zipCode: contact?.zipCode || "",
      birthday: contact?.birthday ? contact.birthday.split('T')[0] : "",
      showBirthday: contact?.showBirthday ?? true,
      showAddress: contact?.showAddress ?? true,
      showPhone: contact?.showPhone ?? true,
      notes: contact?.notes || "",
      addToHousehold: false,
    },
  });

  const saveContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const { addToHousehold, ...contactData } = data;
      
      if (contact) {
        // Update existing contact
        await apiRequest('PATCH', `/api/contacts/${contact.id}`, contactData);
      } else {
        // Create new contact
        await apiRequest('POST', '/api/contacts', { ...contactData, addToHousehold });
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: contact ? "Contact updated successfully" : "Contact added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/households/current'] });
      onSave();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    saveContactMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-first-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-last-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" {...field} data-testid="input-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} data-testid="input-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthday"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Birthday</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-birthday" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Address Fields */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-foreground">Address</h4>
          
          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="123 Main Street" data-testid="input-street" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="City" data-testid="input-city" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="State" data-testid="input-state" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="12345" data-testid="input-zip" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Additional notes about this contact..."
                  {...field}
                  data-testid="textarea-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Household Option */}
        {!contact && (
          <FormField
            control={form.control}
            name="addToHousehold"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel>Add to Household</FormLabel>
                  <p className="text-sm text-muted-foreground">Also add this contact as a member of your household</p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-add-to-household"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Privacy Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Privacy Settings</h3>
          
          <FormField
            control={form.control}
            name="showBirthday"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel>Show Birthday</FormLabel>
                  <p className="text-sm text-muted-foreground">Let family members see the birthday</p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-show-birthday"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showAddress"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel>Show Address</FormLabel>
                  <p className="text-sm text-muted-foreground">Share address with family groups</p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-show-address"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showPhone"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel>Show Phone</FormLabel>
                  <p className="text-sm text-muted-foreground">Display phone number to family</p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-show-phone"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-contact">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saveContactMutation.isPending}
            data-testid="button-save-contact"
          >
            {contact ? "Update Contact" : "Add Contact"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
