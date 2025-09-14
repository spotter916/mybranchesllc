import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  birthday: timestamp("birthday"),
  householdId: varchar("household_id"),
  showBirthday: boolean("show_birthday").default(true),
  showPhone: boolean("show_phone").default(true),
  emailNotifications: boolean("email_notifications").default(true),
  // Calendar integration settings
  calendarSyncEnabled: boolean("calendar_sync_enabled").default(false),
  connectedCalendars: jsonb("connected_calendars"), // Store calendar connection info
  // Subscription fields
  subscriptionPlan: varchar("subscription_plan").default("basic"), // basic, premium
  subscriptionStatus: varchar("subscription_status").default("active"), // active, canceled, past_due
  subscriptionProvider: varchar("subscription_provider").default("stripe"), // stripe, revenuecat
  // Stripe subscription fields
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  // RevenueCat subscription fields  
  revenuecatAppUserId: varchar("revenuecat_app_user_id"),
  revenuecatCustomerId: varchar("revenuecat_customer_id"),
  revenuecatProductId: varchar("revenuecat_product_id"),
  revenuecatOriginalTransactionId: varchar("revenuecat_original_transaction_id"),
  // Common subscription fields
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  // Push notification fields
  fcmTokens: text("fcm_tokens").array(), // Store FCM tokens for all user devices
  pushNotificationsEnabled: boolean("push_notifications_enabled").default(true),
  notificationPreferences: jsonb("notification_preferences"), // Store detailed notification preferences
  // Device information for token management
  devices: jsonb("devices"), // Store device info: [{platform, fcmToken, deviceId, lastSeen}]
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Households table
export const households = pgTable("households", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  ownerId: varchar("owner_id").notNull(),
  details: text("details"), // Searchable details field
  // Address fields for mailing labels
  street: varchar("street"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  country: varchar("country").default("United States"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Household memberships table
export const householdMemberships = pgTable("household_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: varchar("role").default("member"), // member, administrator  
  status: varchar("status").default("active"), // active, pending
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  unique("unique_household_membership").on(table.householdId, table.userId)
]);

// Groups table
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  details: text("details"), // Searchable details field
  creatorId: varchar("creator_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group memberships table
export const groupMemberships = pgTable("group_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: varchar("role").default("member"), // member, administrator, moderator
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  unique("unique_group_membership").on(table.groupId, table.userId)
]);

// Household group memberships table
export const householdGroupMemberships = pgTable("household_group_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull(),
  householdId: varchar("household_id").notNull(),
  status: varchar("status").default("active"), // active, pending
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"),
  location: varchar("location"),
  // Location sharing fields
  latitude: numeric("latitude", { precision: 10, scale: 7 }), // Decimal degrees
  longitude: numeric("longitude", { precision: 10, scale: 7 }), // Decimal degrees
  locationSharing: varchar("location_sharing").default("none"), // none, group, public
  radius: integer("radius"), // Geofence radius in meters
  placeId: varchar("place_id"), // Google Places API ID for consistent location data
  locationAccuracy: integer("location_accuracy"), // GPS accuracy in meters
  groupId: varchar("group_id").notNull(),
  creatorId: varchar("creator_id").notNull(),
  status: varchar("status").default("planning"), // planning, confirmed, completed, cancelled
  // Calendar integration fields
  externalCalendarId: varchar("external_calendar_id"), // ID from external calendar service
  calendarProvider: varchar("calendar_provider"), // google, outlook, etc
  syncedAt: timestamp("synced_at"), // Last sync timestamp
  // Recurring event fields
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: varchar("recurrence_pattern"), // daily, weekly, monthly, yearly, custom
  recurrenceInterval: integer("recurrence_interval").default(1), // Every N intervals
  recurrenceEndDate: timestamp("recurrence_end_date"), // When to stop recurring
  recurrenceEndCount: integer("recurrence_end_count"), // Or after N occurrences
  recurrenceDaysOfWeek: varchar("recurrence_days_of_week"), // For weekly: "1,3,5" (Mon,Wed,Fri)
  recurrenceDayOfMonth: integer("recurrence_day_of_month"), // For monthly: 15th
  recurrenceWeekOfMonth: integer("recurrence_week_of_month"), // For monthly: 2nd Monday
  parentEventId: varchar("parent_event_id"), // Reference to original event for instances
  isRecurrenceException: boolean("is_recurrence_exception").default(false), // Modified/cancelled instance
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  eventId: varchar("event_id").notNull(),
  assignedTo: varchar("assigned_to"),
  status: varchar("status").default("pending"), // pending, in_progress, completed
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  groupId: varchar("group_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved locations table
export const savedLocations = pgTable("saved_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  address: varchar("address"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  placeId: varchar("place_id"), // Google Places API ID
  category: varchar("category"), // home, work, school, favorite, etc
  userId: varchar("user_id").notNull(), // Who saved this location
  householdId: varchar("household_id"), // Optional household sharing
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event templates table for recurring events
export const eventTemplates = pgTable("event_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  duration: integer("duration"), // Duration in minutes
  location: varchar("location"),
  // Location sharing fields
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  locationSharing: varchar("location_sharing").default("none"),
  radius: integer("radius"),
  placeId: varchar("place_id"),
  groupId: varchar("group_id").notNull(),
  creatorId: varchar("creator_id").notNull(),
  // Recurrence settings
  recurrencePattern: varchar("recurrence_pattern").notNull(), // daily, weekly, monthly, yearly
  recurrenceInterval: integer("recurrence_interval").default(1),
  recurrenceDaysOfWeek: varchar("recurrence_days_of_week"), // For weekly patterns
  recurrenceDayOfMonth: integer("recurrence_day_of_month"), // For monthly patterns
  recurrenceWeekOfMonth: integer("recurrence_week_of_month"), // For monthly patterns
  // Template metadata
  isActive: boolean("is_active").default(true),
  defaultTasks: text("default_tasks"), // JSON array of default tasks
  category: varchar("category"), // family-dinner, chores, activities, etc
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Live location sharing table
export const liveLocationSharing = pgTable("live_location_sharing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  accuracy: integer("accuracy"), // GPS accuracy in meters
  heading: numeric("heading", { precision: 5, scale: 2 }), // Compass direction (0-360)
  speed: numeric("speed", { precision: 5, scale: 2 }), // Speed in m/s
  sharingWith: varchar("sharing_with").notNull(), // household, group, emergency
  targetId: varchar("target_id"), // householdId or groupId
  expiresAt: timestamp("expires_at").notNull(), // When sharing stops
  isEmergency: boolean("is_emergency").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Join requests table for households and groups
export const joinRequests = pgTable("join_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // 'household' or 'group'
  targetId: varchar("target_id").notNull(), // householdId or groupId
  requesterId: varchar("requester_id").notNull(), // userId making the request
  householdId: varchar("household_id"), // For group join requests
  status: varchar("status").default("pending"), // pending, approved, denied
  message: text("message"), // Optional message from requester
  approvedBy: varchar("approved_by"), // userId who approved/denied
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Photos table
export const photos = pgTable("photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(),
  objectPath: varchar("object_path").notNull(), // Path in object storage
  thumbnailPath: varchar("thumbnail_path"), // Optional thumbnail path
  uploaderId: varchar("uploader_id").notNull(),
  groupId: varchar("group_id"), // Optional - for group photos
  caption: text("caption"),
  isProfilePhoto: boolean("is_profile_photo").default(false),
  visibility: varchar("visibility").default("private"), // private, group, public
  createdAt: timestamp("created_at").defaultNow(),
});

// Contacts table for personal contacts (separate from household members)
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  street: varchar("street"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  birthday: timestamp("birthday"),
  profileImageUrl: varchar("profile_image_url"),
  showBirthday: boolean("show_birthday").default(true),
  showAddress: boolean("show_address").default(true),
  showPhone: boolean("show_phone").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  household: one(households, {
    fields: [users.householdId],
    references: [households.id],
  }),
  groupMemberships: many(groupMemberships),
  createdGroups: many(groups),
  createdEvents: many(events),
  assignedTasks: many(tasks),
  messages: many(messages),
  photos: many(photos),
  contacts: many(contacts),
}));

export const householdsRelations = relations(households, ({ one, many }) => ({
  owner: one(users, {
    fields: [households.ownerId],
    references: [users.id],
  }),
  members: many(users),
  memberships: many(householdMemberships),
  groupMemberships: many(householdGroupMemberships),
}));

export const householdMembershipsRelations = relations(householdMemberships, ({ one }) => ({
  household: one(households, {
    fields: [householdMemberships.householdId],
    references: [households.id],
  }),
  user: one(users, {
    fields: [householdMemberships.userId],
    references: [users.id],
  }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.creatorId],
    references: [users.id],
  }),
  memberships: many(groupMemberships),
  householdMemberships: many(householdGroupMemberships),
  events: many(events),
  messages: many(messages),
  photos: many(photos),
}));

export const groupMembershipsRelations = relations(groupMemberships, ({ one }) => ({
  group: one(groups, {
    fields: [groupMemberships.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMemberships.userId],
    references: [users.id],
  }),
}));

export const householdGroupMembershipsRelations = relations(householdGroupMemberships, ({ one }) => ({
  group: one(groups, {
    fields: [householdGroupMemberships.groupId],
    references: [groups.id],
  }),
  household: one(households, {
    fields: [householdGroupMemberships.householdId],
    references: [households.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  group: one(groups, {
    fields: [events.groupId],
    references: [groups.id],
  }),
  creator: one(users, {
    fields: [events.creatorId],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  event: one(events, {
    fields: [tasks.eventId],
    references: [events.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  group: one(groups, {
    fields: [messages.groupId],
    references: [groups.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  uploader: one(users, {
    fields: [photos.uploaderId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [photos.groupId],
    references: [groups.id],
  }),
}));

// Contact invitations table for inviting people to join the app
export const contactInvitations = pgTable("contact_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inviterId: varchar("inviter_id").notNull(), // User who sent the invitation
  contactId: varchar("contact_id"), // Optional: associated contact
  email: varchar("email").notNull(), // Email of person being invited
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  invitationToken: varchar("invitation_token").notNull().unique(),
  status: varchar("status").default("pending"), // pending, accepted, expired
  message: text("message"), // Personal message from inviter
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  acceptedUserId: varchar("accepted_user_id"), // User ID when they join
  createdAt: timestamp("created_at").defaultNow(),
});

export const contactsRelations = relations(contacts, ({ one }) => ({
  user: one(users, {
    fields: [contacts.userId],
    references: [users.id],
  }),
}));

export const contactInvitationsRelations = relations(contactInvitations, ({ one }) => ({
  inviter: one(users, {
    fields: [contactInvitations.inviterId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [contactInvitations.contactId],
    references: [contacts.id],
  }),
  acceptedUser: one(users, {
    fields: [contactInvitations.acceptedUserId],
    references: [users.id],
  }),
}));

export const joinRequestsRelations = relations(joinRequests, ({ one }) => ({
  requester: one(users, {
    fields: [joinRequests.requesterId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [joinRequests.approvedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHouseholdSchema = createInsertSchema(households).omit({
  id: true,
  createdAt: true,
});

export const insertHouseholdMembershipSchema = createInsertSchema(householdMemberships).omit({
  id: true,
  joinedAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
});

export const insertGroupMembershipSchema = createInsertSchema(groupMemberships).omit({
  id: true,
  joinedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertJoinRequestSchema = createInsertSchema(joinRequests).omit({
  id: true,
  createdAt: true,
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
});

export const insertSavedLocationSchema = createInsertSchema(savedLocations).omit({
  id: true,
  createdAt: true,
});

export const insertLiveLocationSharingSchema = createInsertSchema(liveLocationSharing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventTemplateSchema = createInsertSchema(eventTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

export const insertContactInvitationSchema = createInsertSchema(contactInvitations).omit({
  id: true,
  createdAt: true,
  inviterId: true,
  invitationToken: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertHousehold = z.infer<typeof insertHouseholdSchema>;
export type Household = typeof households.$inferSelect;
export type InsertHouseholdMembership = z.infer<typeof insertHouseholdMembershipSchema>;
export type HouseholdMembership = typeof householdMemberships.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroupMembership = z.infer<typeof insertGroupMembershipSchema>;
export type GroupMembership = typeof groupMemberships.$inferSelect;
export type HouseholdGroupMembership = typeof householdGroupMemberships.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertJoinRequest = z.infer<typeof insertJoinRequestSchema>;
export type JoinRequest = typeof joinRequests.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertSavedLocation = z.infer<typeof insertSavedLocationSchema>;
export type SavedLocation = typeof savedLocations.$inferSelect;
export type InsertLiveLocationSharing = z.infer<typeof insertLiveLocationSharingSchema>;
export type LiveLocationSharing = typeof liveLocationSharing.$inferSelect;
export type InsertEventTemplate = z.infer<typeof insertEventTemplateSchema>;
export type EventTemplate = typeof eventTemplates.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContactInvitation = z.infer<typeof insertContactInvitationSchema>;
export type ContactInvitation = typeof contactInvitations.$inferSelect;
